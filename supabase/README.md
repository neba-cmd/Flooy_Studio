# Supabase Setup

The application now models photo delivery as:

1. Event
2. Client Gallery
3. Photo

For a fresh project, run `schema.sql` in the Supabase SQL editor. If you
want to wipe an old development schema first, run `reset-and-create.sql`,
then run `schema.sql`.

The schema creates:

- `events`
- `client_galleries`
- `photos`
- storage buckets: `previews`, `originals`
- RLS policies for authenticated photographers
- public RPC: `get_client_gallery_by_access_code`
- authenticated RPC: `ensure_photographer_profile`

After creating a Supabase Auth user, the app will create the matching
`photographers` profile row automatically on first admin login through
`ensure_photographer_profile`.

Required deployment environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase anon or publishable key)

The app does not require a service-role key for normal operation. Original
photo downloads are protected by the `Paid clients can read original objects`
Storage RLS policy in `schema.sql`.
