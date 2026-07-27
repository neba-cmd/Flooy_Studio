-- RUN ONCE in Supabase SQL Editor on an existing installation.
-- Centralizes events and photos for the company while recording who took each photo.

alter table public.photographer_profiles
  add column if not exists email text;

update public.photographer_profiles profile
set email = lower(coalesce(auth_user.email, 'unknown@example.invalid'))
from auth.users auth_user
where auth_user.id = profile.id
  and profile.email is null;

alter table public.photographer_profiles
  alter column email set not null;

alter table public.gallery_photos
  add column if not exists photographer_id uuid
  references public.photographer_profiles (id);

-- Attribute older photos to the photographer who created their event.
update public.gallery_photos photo
set photographer_id = event.owner_id
from public.customer_galleries gallery
join public.photo_events event on event.id = gallery.event_id
where photo.gallery_id = gallery.id
  and photo.photographer_id is null;

alter table public.gallery_photos
  alter column photographer_id set not null;

create index if not exists gallery_photos_photographer_idx
on public.gallery_photos (photographer_id);

create or replace function public.create_photographer_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.photographer_profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email, 'Photographer'),
    lower(coalesce(new.email, 'unknown@example.invalid'))
  )
  on conflict (id) do update
  set email = excluded.email;
  return new;
end;
$$;

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

  insert into public.photographer_profiles (id, display_name, email)
  values (
    current_user_id,
    coalesce(auth.jwt() ->> 'email', 'Photographer'),
    lower(coalesce(auth.jwt() ->> 'email', 'unknown@example.invalid'))
  )
  on conflict (id) do update
  set email = excluded.email;

  return query
  select profile.display_name, true
  from public.photographer_profiles profile
  where profile.id = current_user_id;
end;
$$;

drop policy if exists "Photographer owns profile" on public.photographer_profiles;
drop policy if exists "Photographer owns events" on public.photo_events;
drop policy if exists "Photographer owns customer galleries" on public.customer_galleries;
drop policy if exists "Photographer owns gallery photos" on public.gallery_photos;

create policy "Company photographers view team"
on public.photographer_profiles for select to authenticated
using (true);

create policy "Company photographers manage events"
on public.photo_events for all to authenticated
using (true) with check (true);

create policy "Company photographers manage customer galleries"
on public.customer_galleries for all to authenticated
using (true) with check (true);

create policy "Company photographers manage gallery photos"
on public.gallery_photos for all to authenticated
using (true)
with check (photographer_id = (select auth.uid()));

drop policy if exists "Photographer reads own photo files" on storage.objects;
drop policy if exists "Photographer uploads own photo files" on storage.objects;
drop policy if exists "Photographer updates own photo files" on storage.objects;
drop policy if exists "Photographer deletes own photo files" on storage.objects;

create policy "Company photographers read photo files"
on storage.objects for select to authenticated
using (bucket_id in ('photo-previews', 'photo-originals'));

create policy "Company photographers upload photo files"
on storage.objects for insert to authenticated
with check (bucket_id in ('photo-previews', 'photo-originals'));

create policy "Company photographers update photo files"
on storage.objects for update to authenticated
using (bucket_id in ('photo-previews', 'photo-originals'))
with check (bucket_id in ('photo-previews', 'photo-originals'));

create policy "Company photographers delete photo files"
on storage.objects for delete to authenticated
using (bucket_id in ('photo-previews', 'photo-originals'));

revoke all on function public.create_photographer_profile()
from public, anon, authenticated;

revoke all on function public.ensure_photographer_profile()
from public, anon;

grant execute on function public.ensure_photographer_profile()
to authenticated;
