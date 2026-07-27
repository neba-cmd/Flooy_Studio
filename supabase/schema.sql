-- FLOOY PHOTO DELIVERY — FRESH SUPABASE PROJECT
-- Run this entire file once in Supabase Dashboard > SQL Editor.
--
-- Clear structure:
--   photographer_profiles -> photo_events -> customer_galleries -> gallery_photos
-- Storage:
--   photo-previews (watermarked) and photo-originals (full quality)

create extension if not exists pgcrypto;

-- 1. Signed-in photographers
create table public.photographer_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Photographer',
  created_at timestamptz not null default now()
);

-- 2. Events owned by a photographer
create table public.photo_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.photographer_profiles (id) on delete cascade,
  event_name text not null check (length(trim(event_name)) between 1 and 120),
  event_date timestamptz,
  venue text,
  created_at timestamptz not null default now()
);

-- 3. One customer and one simple access code per gallery
create table public.customer_galleries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.photo_events (id) on delete cascade,
  customer_name text not null check (length(trim(customer_name)) between 1 and 120),
  customer_email text not null check (
    customer_email = lower(trim(customer_email))
    and customer_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ),
  customer_phone text not null check (length(trim(customer_phone)) between 7 and 30),
  access_code text not null unique check (access_code ~ '^[0-9]{6}$'),
  is_paid boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  constraint paid_date_matches_status check (
    (is_paid and paid_at is not null) or (not is_paid and paid_at is null)
  )
);

-- 4. Photo metadata. Event and photographer IDs are intentionally not
-- duplicated here; both are available through customer_galleries.
create table public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  upload_key uuid not null unique,
  gallery_id uuid not null references public.customer_galleries (id) on delete cascade,
  original_file_name text not null,
  preview_storage_path text not null unique,
  original_storage_path text not null unique,
  status text not null default 'ready' check (status in ('uploading', 'ready', 'failed')),
  captured_at timestamptz,
  created_at timestamptz not null default now()
);

-- Generate an easy six-digit customer code and retry on the rare collision.
create or replace function public.generate_gallery_access_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := lpad(floor(random() * 1000000)::integer::text, 6, '0');
    exit when not exists (
      select 1 from public.customer_galleries where access_code = candidate
    );
  end loop;
  return candidate;
end;
$$;

alter table public.customer_galleries
  alter column access_code set default public.generate_gallery_access_code();

-- Automatically create the photographer profile after an Auth user is added.
create or replace function public.create_photographer_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.photographer_profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email, 'Photographer'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger create_photographer_profile_on_signup
after insert on auth.users
for each row execute function public.create_photographer_profile();

-- Also repairs the profile for an Auth user created before this SQL is run.
create or replace function public.ensure_photographer_profile()
returns table (display_name text, is_admin boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Not authenticated'; end if;

  insert into public.photographer_profiles (id, display_name)
  values (current_user_id, coalesce(auth.jwt() ->> 'email', 'Photographer'))
  on conflict (id) do nothing;

  return query
  select p.display_name, true
  from public.photographer_profiles p
  where p.id = current_user_id;
end;
$$;

revoke all on function public.generate_gallery_access_code() from public;
grant execute on function public.generate_gallery_access_code() to authenticated;
grant execute on function public.ensure_photographer_profile() to authenticated;

-- Backup-friendly indexes
create index photo_events_owner_idx on public.photo_events (owner_id);
create index customer_galleries_event_idx on public.customer_galleries (event_id);
create index customer_galleries_code_idx on public.customer_galleries (access_code);
create index customer_galleries_phone_idx on public.customer_galleries (customer_phone);
create index customer_galleries_email_idx on public.customer_galleries (customer_email);
create index gallery_photos_gallery_idx on public.gallery_photos (gallery_id);
create index gallery_photos_created_idx on public.gallery_photos (created_at);

-- Database security: photographers can access only their own event tree.
alter table public.photographer_profiles enable row level security;
alter table public.photo_events enable row level security;
alter table public.customer_galleries enable row level security;
alter table public.gallery_photos enable row level security;

create policy "Photographer owns profile"
on public.photographer_profiles for all to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy "Photographer owns events"
on public.photo_events for all to authenticated
using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Photographer owns customer galleries"
on public.customer_galleries for all to authenticated
using (
  exists (
    select 1 from public.photo_events e
    where e.id = event_id and e.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.photo_events e
    where e.id = event_id and e.owner_id = auth.uid()
  )
);

create policy "Photographer owns gallery photos"
on public.gallery_photos for all to authenticated
using (
  exists (
    select 1
    from public.customer_galleries g
    join public.photo_events e on e.id = g.event_id
    where g.id = gallery_id and e.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.customer_galleries g
    join public.photo_events e on e.id = g.event_id
    where g.id = gallery_id and e.owner_id = auth.uid()
  )
);

-- Private, image-only storage with a 50 MB limit.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'photo-previews',
    'photo-previews',
    false,
    52428800,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'photo-originals',
    'photo-originals',
    false,
    52428800,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  );

-- Storage path format: <customer_gallery_id>/<unique_file_name>
create policy "Photographer reads own photo files"
on storage.objects for select to authenticated
using (
  bucket_id in ('photo-previews', 'photo-originals')
  and exists (
    select 1
    from public.customer_galleries g
    join public.photo_events e on e.id = g.event_id
    where g.id = ((storage.foldername(name))[1])::uuid
      and e.owner_id = auth.uid()
  )
);

create policy "Photographer uploads own photo files"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('photo-previews', 'photo-originals')
  and exists (
    select 1
    from public.customer_galleries g
    join public.photo_events e on e.id = g.event_id
    where g.id = ((storage.foldername(name))[1])::uuid
      and e.owner_id = auth.uid()
  )
);

create policy "Photographer updates own photo files"
on storage.objects for update to authenticated
using (
  bucket_id in ('photo-previews', 'photo-originals')
  and exists (
    select 1
    from public.customer_galleries g
    join public.photo_events e on e.id = g.event_id
    where g.id = ((storage.foldername(name))[1])::uuid
      and e.owner_id = auth.uid()
  )
)
with check (
  bucket_id in ('photo-previews', 'photo-originals')
  and exists (
    select 1
    from public.customer_galleries g
    join public.photo_events e on e.id = g.event_id
    where g.id = ((storage.foldername(name))[1])::uuid
      and e.owner_id = auth.uid()
  )
);

create policy "Photographer deletes own photo files"
on storage.objects for delete to authenticated
using (
  bucket_id in ('photo-previews', 'photo-originals')
  and exists (
    select 1
    from public.customer_galleries g
    join public.photo_events e on e.id = g.event_id
    where g.id = ((storage.foldername(name))[1])::uuid
      and e.owner_id = auth.uid()
  )
);

-- No anonymous table or Storage policies are created. Customer access goes
-- only through the server routes, which validate the six-digit code and sign
-- individual private files for a short time.
