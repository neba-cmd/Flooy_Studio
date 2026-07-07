-- Destructive reset for development / empty projects.
-- This drops the old photo-delivery tables and recreates the clean
-- Event -> Client Gallery -> Photo architecture.
--
-- Do not run this if you need to keep existing production data.

drop function if exists public.get_client_gallery_by_access_code(text);
drop function if exists public.get_gallery_by_code(text);
drop function if exists public.ensure_photographer_profile();

drop table if exists public.photos cascade;
drop table if exists public.client_galleries cascade;
drop table if exists public.events cascade;
drop table if exists public.participants cascade;
drop table if exists public.photographers cascade;

-- Supabase blocks direct deletes from storage.objects/storage.buckets.
-- If you need to wipe Storage later, use the Supabase Dashboard Storage UI
-- or the Storage API. For a fresh project, leaving buckets alone is fine:
-- schema.sql recreates/keeps `previews` and `originals` with `on conflict do nothing`.

-- After this succeeds, run supabase/schema.sql.
