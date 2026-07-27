# Fresh Supabase setup

1. Create a new Supabase project.
2. Open **SQL Editor**, paste all of `schema.sql`, and run it once.
3. Open **Authentication → Users** and create the photographer login.
4. Copy the new project values into `.env.local` and the production host:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never prefix it with
`NEXT_PUBLIC_`.

## Data structure

```text
photographer_profiles
└── photo_events
    └── customer_galleries
        └── gallery_photos
```

Each `customer_galleries` row contains the customer's name, email, phone,
six-digit access code, and payment status. Each `gallery_photos` row contains
clear filenames and private Storage paths, making JSON/CSV backups easy to
understand and restore.

Storage uses two private buckets:

- `photo-previews`
- `photo-originals`

Customers never receive direct database or bucket access. Server routes verify
their code and issue short-lived links to individual files.

## Backup

With the environment variables configured, run:

```bash
node --env-file=.env.local scripts/reset-photo-delivery-data.mjs backup
```

Backups are written under `supabase/backups/` and include readable JSON,
downloaded photo files, a file count, byte count, and SHA-256 hashes.
