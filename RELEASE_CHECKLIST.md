# Version 1 Release Checklist

## Product Readiness
- Verify lender flow: create record, borrower email sent, borrower can acknowledge.
- Verify borrower flow: acknowledge active record, submit partial repayment, submit final repayment.
- Verify lender review flow: confirm repayment, reject repayment, completed record moves into `Completed`.
- Verify dashboard search, filters, and completed/history navigation on desktop and mobile.
- Verify history page timestamps and event ordering on old and newly created records.

## Infrastructure Decisions
- App hosting: default to Vercel unless you intentionally choose another managed Next.js host.
- Database hosting: confirm Neon production project, branch strategy, and backup expectations.
- Email delivery: confirm SMTP provider/account for production volume and deliverability.
- Environment variable management: store all prod secrets in hosting provider secret manager.

## Auth Configuration
- Set production `NEXTAUTH_URL`.
- Set strong production `NEXTAUTH_SECRET`.
- Validate env values with `npm run check:env`.
- Confirm Google OAuth production client has correct callback URLs.
- Confirm authorized domains and consent screen settings in Google Cloud.

## Database + Schema
- Confirm production database matches `prisma/schema.prisma`.
- Keep `prisma db push`/migration history decision documented because this database was not Prisma-migration-baselined originally.
- Capture the exact command to sync schema in production.
- Take a database snapshot/backup before launch changes.

## Email Configuration
- Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
- Send test emails for:
  - borrower invite/acknowledgment request
  - lender acknowledgment notification
  - lender repayment review notification
- Verify deliverability and spam-folder behavior.

## Monitoring + Operations
- Add error monitoring for server routes and auth flow.
- Add logging/alerting for email failures.
- Decide who receives operational alerts.
- Document rollback steps for bad deploys.

## UX / QA
- Test sign in/out across desktop and mobile.
- Test empty states, completed states, and pending review states.
- Test long names, long titles, and edge-case amounts.
- Test with multiple historical repayments on one record.
- Test navigation back to dashboard from history page.

## Launch Day
- Deploy app.
- Validate env vars in production.
- Run `npm run verify:release` against production-shaped env values before final deploy.
- Smoke test end-to-end with two real accounts.
- Confirm database writes, email sends, and callback URLs.
- Announce V1 only after smoke test passes.
