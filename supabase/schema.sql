-- Photo delivery domain model:
-- Event -> Client Gallery -> Photo.
-- Run this in the Supabase SQL editor after reset-and-create.sql,
-- or on a fresh Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.photographers (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references public.photographers (id) on delete cascade,
  name text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_galleries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  photographer_id uuid not null references public.photographers (id) on delete cascade,
  name text not null,
  access_code text not null unique,
  notes text,
  paid boolean not null default false,
  paid_at timestamptz,
  paid_by uuid references public.photographers (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  event_id uuid not null references public.events (id) on delete cascade,
  gallery_id uuid not null references public.client_galleries (id) on delete cascade,
  photographer_id uuid not null references public.photographers (id) on delete cascade,
  file_name text not null,
  preview_path text not null,
  original_path text not null,
  upload_status text not null default 'uploaded',
  taken_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.create_photographer_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.photographers (id, display_name)
  values (new.id, coalesce(new.email, 'Photographer'))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_photographer_profile_on_auth_user on auth.users;
create trigger create_photographer_profile_on_auth_user
after insert on auth.users
for each row execute function public.create_photographer_profile();

create or replace function public.ensure_photographer_profile()
returns table (
  display_name text,
  is_admin boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.photographers (id, display_name)
  values (
    current_user_id,
    coalesce(auth.jwt() ->> 'email', 'Photographer')
  )
  on conflict (id) do nothing;

  return query
  select p.display_name, p.is_admin
  from public.photographers p
  where p.id = current_user_id;
end;
$$;

grant execute on function public.ensure_photographer_profile() to authenticated;

create index if not exists events_photographer_id_idx on public.events (photographer_id);
create index if not exists client_galleries_event_id_idx on public.client_galleries (event_id);
create index if not exists client_galleries_access_code_idx on public.client_galleries (access_code);
create index if not exists photos_gallery_id_idx on public.photos (gallery_id);
create index if not exists photos_event_id_idx on public.photos (event_id);

alter table public.photographers enable row level security;
alter table public.events enable row level security;
alter table public.client_galleries enable row level security;
alter table public.photos enable row level security;

drop policy if exists "Photographers can read their profile" on public.photographers;
create policy "Photographers can read their profile"
on public.photographers for select
to authenticated
using (id = auth.uid());

drop policy if exists "Photographers can create their profile" on public.photographers;
create policy "Photographers can create their profile"
on public.photographers for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Photographers can update their profile" on public.photographers;
create policy "Photographers can update their profile"
on public.photographers for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Photographers manage their events" on public.events;
create policy "Photographers manage their events"
on public.events for all
to authenticated
using (photographer_id = auth.uid())
with check (photographer_id = auth.uid());

drop policy if exists "Photographers manage their client galleries" on public.client_galleries;
create policy "Photographers manage their client galleries"
on public.client_galleries for all
to authenticated
using (photographer_id = auth.uid())
with check (
  photographer_id = auth.uid()
  and exists (
    select 1
    from public.events e
    where e.id = event_id
      and e.photographer_id = auth.uid()
  )
);

drop policy if exists "Photographers manage their photos" on public.photos;
create policy "Photographers manage their photos"
on public.photos for all
to authenticated
using (photographer_id = auth.uid())
with check (
  photographer_id = auth.uid()
  and exists (
    select 1
    from public.client_galleries g
    where g.id = gallery_id
      and g.event_id = event_id
      and g.photographer_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('previews', 'previews', false), ('originals', 'originals', false)
on conflict (id) do nothing;

drop policy if exists "Anyone can read preview objects" on storage.objects;
create policy "Anyone can read preview objects"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'previews');

drop policy if exists "Paid clients can read original objects" on storage.objects;
create policy "Paid clients can read original objects"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'originals'
  and exists (
    select 1
    from public.client_galleries g
    where g.id = ((storage.foldername(name))[2])::uuid
      and g.event_id = ((storage.foldername(name))[1])::uuid
      and g.paid = true
  )
);

drop policy if exists "Photographers upload preview objects" on storage.objects;
create policy "Photographers upload preview objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'previews'
  and exists (
    select 1
    from public.events e
    where e.id = ((storage.foldername(name))[1])::uuid
      and e.photographer_id = auth.uid()
  )
);

drop policy if exists "Photographers upload original objects" on storage.objects;
create policy "Photographers upload original objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'originals'
  and exists (
    select 1
    from public.events e
    where e.id = ((storage.foldername(name))[1])::uuid
      and e.photographer_id = auth.uid()
  )
);

drop policy if exists "Photographers update their uploaded objects" on storage.objects;
create policy "Photographers update their uploaded objects"
on storage.objects for update
to authenticated
using (
  bucket_id in ('previews', 'originals')
  and exists (
    select 1
    from public.events e
    where e.id = ((storage.foldername(name))[1])::uuid
      and e.photographer_id = auth.uid()
  )
)
with check (
  bucket_id in ('previews', 'originals')
  and exists (
    select 1
    from public.events e
    where e.id = ((storage.foldername(name))[1])::uuid
      and e.photographer_id = auth.uid()
  )
);

create or replace function public.get_client_gallery_by_access_code(p_code text)
returns table (
  gallery_id uuid,
  event_id uuid,
  gallery_name text,
  access_code text,
  paid boolean,
  photo_id uuid,
  preview_path text,
  original_path text,
  taken_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    g.id as gallery_id,
    g.event_id,
    g.name as gallery_name,
    g.access_code,
    g.paid,
    p.id as photo_id,
    p.preview_path,
    case when g.paid then p.original_path else null end as original_path,
    coalesce(p.taken_at, p.created_at) as taken_at
  from public.client_galleries g
  left join public.photos p on p.gallery_id = g.id
  where g.access_code = upper(trim(p_code))
  order by p.created_at desc;
$$;

grant execute on function public.get_client_gallery_by_access_code(text) to anon, authenticated;
