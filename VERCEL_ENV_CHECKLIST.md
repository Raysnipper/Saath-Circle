# Vercel Environment Checklist

Use this file as a copy checklist while entering Production environment variables in Vercel.

Important:
- Do not paste values from `.env` into production unless they were intentionally generated for production.
- Rotate any local/test values first if they were used during development.
- Keep `Production`, `Preview`, and `Development` values separate where appropriate.

## Recommended Production Values

### `DATABASE_URL`
- Source: Neon production project or branch connection string
- Expectation: PostgreSQL connection string with SSL enabled
- Example shape:
  `postgresql://USER:PASSWORD@HOST/neondb?sslmode=require`

### `NEXTAUTH_SECRET`
- Source: newly generated production-only secret
- Expectation: long random string, 32+ characters
- Do not reuse the current local/dev secret

### `NEXTAUTH_URL`
- Source: final production domain
- Example:
  `https://your-production-domain.com`

### `GOOGLE_CLIENT_ID`
- Source: Google Cloud production OAuth client
- Expectation: production client, not the local/test client

### `GOOGLE_CLIENT_SECRET`
- Source: Google Cloud production OAuth client
- Expectation: production secret, rotated if the old one was used in development or shared

### `SMTP_HOST`
- Source: production SMTP provider
- Example:
  `smtp.gmail.com`

### `SMTP_PORT`
- Source: production SMTP provider
- Examples:
  `587` for STARTTLS
  `465` for implicit TLS

### `SMTP_USER`
- Source: dedicated production sender account
- Expectation: inbox/account intended for production delivery

### `SMTP_PASS`
- Source: SMTP app password or provider credential
- Expectation: production credential, rotated if the previous one was used locally

### `SMTP_FROM`
- Source: approved sender identity
- Example:
  `Saath Circle <your-email@example.com>`

## Vercel Entry Checklist

1. Open the project in Vercel.
2. Go to `Settings` -> `Environment Variables`.
3. Add each required variable for the `Production` environment.
4. Double-check `NEXTAUTH_URL` matches the exact live domain.
5. Save changes and trigger a redeploy.

## After Saving Env Vars

1. Confirm the production domain is assigned in Vercel.
2. Confirm Google OAuth uses:
   `https://your-production-domain.com/api/auth/callback/google`
3. Run the production smoke test from `SMOKE_TEST.md`.
