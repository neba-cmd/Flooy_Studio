# Supabase Setup

The application models photo delivery as:

1. Event
2. Client Gallery
3. Photo


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
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; required for customer downloads)

Never prefix the service-role key with `NEXT_PUBLIC_` or expose it in browser
code. The `/api/download-original` server route uses it only after verifying
the access code, paid gallery status, and requested photo membership. It then
creates a short-lived, single-file download URL.
