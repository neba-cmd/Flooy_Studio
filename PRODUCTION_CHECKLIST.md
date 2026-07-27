# Production checklist

## Required before deployment

- Run `supabase/schema.sql` on a fresh Supabase project.
- If the database already exists, run:
  - `supabase/phone-initial-access-codes.sql`
  - `supabase/company-workspace.sql`
  - `supabase/production-hardening.sql`
- Create at least one photographer in Supabase Authentication.
- Configure the same project values locally and in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SITE_URL`
- Remove stale `NEXT_PUBLIC_SUPABASE_ANON_KEY` values from Vercel when using
  the new publishable key.
- Apply Vercel environment variables to Production, Preview, and Development,
  then redeploy.

## Validation

```bash
npm ci
npm run check
npm run build
npm run preflight
```

## Event-day smoke test

1. Sign in at `/admin/login`.
2. Create a test event and customer.
3. Confirm the generated code contains three name characters and three digits.
4. Upload at least two photos, including one while offline.
5. Confirm Waiting → Uploading → Sent and the thumbnail history.
6. Mark the gallery paid.
7. Open `/event-photos` in a private mobile browser.
8. Confirm previews load and an original downloads with its filename.
9. Mark the gallery unpaid and confirm original downloads lock immediately.
10. Run a backup and verify the manifest and file count.

## Operational safeguards

- Keep Supabase email/password signup disabled; create photographer users
  manually.
- Enable MFA for Supabase and Vercel administrator accounts.
- Configure a Vercel WAF rate-limit rule for `/api/client-gallery` if the plan
  supports it. The application limiter is per runtime instance and is a
  best-effort fallback.
- Monitor Vercel function errors and Supabase Storage/database usage during the
  event.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` with a `NEXT_PUBLIC_` prefix.
