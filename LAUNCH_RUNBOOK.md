# Launch Runbook

This runbook is for the first production deployment of V1.

## 1. Rotate Secrets First

Treat this as required before launch if local/dev secrets were ever stored outside a private machine, screenshared, or pasted into chat/tools.

Rotate:
- database password or connection string
- `NEXTAUTH_SECRET`
- Google OAuth client secret
- SMTP password or app password

## 2. Prepare Production Services

### Vercel
- create or confirm the production project
- assign the final production domain
- add production environment variables from `VERCEL_ENV_CHECKLIST.md`

### Neon
- create or confirm the production database/project
- take a snapshot or confirm rollback posture before schema sync
- copy the production connection string into Vercel as `DATABASE_URL`

### Google OAuth
- create or confirm a dedicated production OAuth client
- set authorized origin:
  `https://your-production-domain.com`
- set authorized redirect URI:
  `https://your-production-domain.com/api/auth/callback/google`

### SMTP
- confirm the production sender account
- confirm the sender name/address you want users to see
- verify the provider allows the expected send volume

## 3. Local Preflight

Before touching production deploy:

```bash
npm run check:env
npm run verify
```

If you want the full preflight:

```bash
npm run verify:release
```

If `next build` fails only because of the local agent sandbox, rerun `npm run build` in your normal terminal.

## 4. Schema Sync

This project is currently using `prisma db push` for the live schema because the database is not fully baselined under Prisma migration history.

Production sync command:

```bash
npx prisma generate
npx prisma db push
```

Run this only after confirming the target `DATABASE_URL` is the intended production database.

## 5. Deploy

1. Trigger the production deployment in Vercel.
2. Wait for the build to complete.
3. Open the live app and confirm it loads.
4. Confirm sign-in redirects to Google successfully.

## 6. Smoke Test With Two Real Accounts

Use `SMOKE_TEST.md` and verify:
- lender can create a record
- borrower receives email
- borrower can acknowledge
- borrower can submit partial and final repayments
- lender can confirm repayments
- completed record appears under `Completed`
- history page shows timestamps in the expected order

## 7. Launch Decision

Launch only if all of the following are true:
- build succeeded
- auth worked on the live domain
- emails delivered successfully
- production database writes succeeded
- smoke test passed end-to-end

## 8. Immediate Rollback Trigger

Pause launch and roll back if any of these happen:
- Google sign-in fails on the production domain
- borrower emails do not send
- production database writes fail
- users can access records they should not see
- completed/history flow behaves inconsistently
