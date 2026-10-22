# Launch status

Last updated: 22 Oct 2026. No secrets in this file; the repo is public.

## Where things run

| Piece | Where |
|---|---|
| Website (this repo) | Vercel project `streamflo-edu`, live at https://streamflo.avytria.com |
| Backend (`Veranzi/streamfloedutenabackend`) | Render service `edutena-api`, https://edutena-api.onrender.com |
| Database + file storage | Supabase project `socngkpbvrvqxtyhbopo` (Frankfurt, free tier). Website tables in `public`, backend tables in the `edutena` schema |
| Google sign in | Google Cloud project `edutech-bf86e`, OAuth client "Web client 2" |

The old PHP site at streamflo.co.ke is not the live site. It is only the source of the old school data.

## Done

- Both apps were pointing at a deleted Supabase project. `DATABASE_URL` on Vercel and Render now uses the transaction pooler of `socngkpbvrvqxtyhbopo`.
- All pending migrations applied (backend ledger: `edutena.schema_migrations`; website: blog comment moderation).
- Payments: manual M-Pesa (Pochi) with admin approval only. STK push is hidden on the website and refused by the backend while `MPESA_ENV` is not `production`.
- Keep-alive workflow (`.github/workflows/keep-alive.yml`) pings the site and API every 10 minutes so the free Supabase project is not paused.
- Google sign in fixed (new OAuth client). The login page only signs in existing accounts; the parent and student signup pages create accounts.
- Test school "Ndurarua" deleted. The directory currently has 0 schools.

## Next

1. Import the old site's data. Get the MySQL export (`.sql`) and the `uploads` folder from the old hosting (cPanel), review what is in it, then import schools, blog posts and photos. Keep the export out of git.
2. Decide what to do with the institution login `Anzydee Kalaka` (its school was the deleted test school).
3. Change the Supabase database password (letters and digits only), then update `DATABASE_URL` on Vercel, Render and any local `.env`.
4. Later, for real STK push: live Daraja keys, `MPESA_ENV=production` on Render, `NEXT_PUBLIC_MPESA_STK_ENABLED=true` on Vercel.

## Gotchas

- `DATABASE_URL` must not end with `?sslmode=require`; the `pg` driver then verifies the certificate strictly and the connection fails.
- Never re-run backend migration `2026-04-28-uploads-and-tiers.sql`: it deletes all subscriptions and plans. Run migrations with `node scripts/run-migration.js`, which skips files already recorded.
- On a new machine, create `streamfloedutenabackend/.env` with `DATABASE_URL=...` (copy the value from Render). It is git ignored on purpose.
