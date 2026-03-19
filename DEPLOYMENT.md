# Deployment Guide

## Recommended V1 Shape
- App hosting: Vercel or another managed Next.js host
- Database: Neon PostgreSQL
- Email: SMTP provider account dedicated to production
- Secrets: hosting platform environment variables only

## Before Deploying
- Rotate any local/test secrets before production if they were ever shared outside your machine.
- Confirm production domain.
- Confirm Google OAuth production callback URLs.
- Confirm production SMTP account and sender identity.
- Confirm database backup/snapshot exists before final schema sync.
- Use `VERCEL_ENV_CHECKLIST.md` for value-by-value env setup.
- Use `LAUNCH_RUNBOOK.md` for the actual release sequence.

## Environment Variables
Use `.env.example` as the source of truth for required values:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Before deploying, validate the values locally with:
```bash
npm run check:env
```

For a full local preflight:
```bash
npm run verify:release
```

If `next build` hits a local shell/sandbox permission issue, run `npm run build` directly in your normal terminal to confirm the production build outside the agent sandbox.

## Deploy Sequence
1. Choose the production stack for V1:
   Vercel for app hosting, Neon for PostgreSQL, and a dedicated SMTP account.
2. Set all production environment variables in the hosting platform.
3. In Google Cloud, set the production Authorized JavaScript origin and callback URL:
   - origin: `https://your-production-domain.com`
   - callback: `https://your-production-domain.com/api/auth/callback/google`
4. Run `npm run check:env` against production-shaped values locally before pushing them into hosting.
5. Run `npx prisma generate`.
6. Sync the schema to production database.
   Current project note:
   the existing database was synced with `prisma db push`, not a fully baselined Prisma migration chain.
7. Build and deploy the app.
8. Run the smoke test checklist in `SMOKE_TEST.md`.

## Vercel Setup
1. Import the repository into Vercel.
2. Add all production environment variables for the Production environment.
3. Set the production domain in Vercel before finalizing OAuth callback URLs.
4. Redeploy after any secret or OAuth callback change.

## Neon Setup
1. Create or confirm the production Neon project.
2. Take a snapshot or confirm rollback/backup posture before schema sync.
3. Use the pooled/production connection string as `DATABASE_URL`.
4. Run `npx prisma db push` only after confirming the target database is the production branch/project you intend to use.

## Google OAuth Setup
1. Use a dedicated production OAuth client instead of reusing a loose local/test client.
2. Add the final production domain under authorized domains where required.
3. Add the exact callback URL:
   `https://your-production-domain.com/api/auth/callback/google`
4. Verify the consent screen branding and support email before launch.

## Database Sync Note
This project currently has a migration SQL file for history precision, but the live database was not originally created under Prisma migration history.

For the current V1 setup, the practical production sync path is:
```bash
npx prisma db push
```

After V1, consider creating a proper migration baseline so future deploys can use Prisma migrations more predictably.

## Build Note
The app now uses a local/system font stack, so the build does not depend on outbound Google Fonts fetches.

That means:
- local and CI builds are more reproducible
- deployment platform outbound font access is no longer a requirement
