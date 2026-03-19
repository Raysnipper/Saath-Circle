# Next Session Todo

## Current Status
- Dashboard, search, filters, and mobile-first card refinement are in a strong V1 state.
- `Completed` stayed as the dashboard filter label.
- History/detail page exists and now uses precise timestamps:
  - `Loan.acknowledgedAt`
  - `Loan.completedAt`
  - `Transaction.reviewedAt`
- Completed cards are quieter and include `View History`.
- `Last activity` is implemented on cards.
- Nav brand now links back to dashboard, and history page back navigation is more visible.

## Highest Priority Next
- Continue from production readiness and deployment prep.
- Use these files as the working set next session:
  - `RELEASE_CHECKLIST.md`
  - `PRODUCTION_READINESS.md`
  - `DEPLOYMENT.md`
  - `SMOKE_TEST.md`
  - `.env.example`

## Immediate Next Steps
- Rotate current local/test secrets before production use:
  - database credentials
  - `NEXTAUTH_SECRET`
  - Google OAuth secret
  - SMTP password
- Use `VERCEL_ENV_CHECKLIST.md` to enter production env vars cleanly.
- Use `LAUNCH_RUNBOOK.md` for the first live release sequence.
- Set up production environment variables in hosting.
- Decide final production hosting stack:
  - app hosting
  - production database/project
  - production email sender/account
- Run production-like smoke test with two real accounts.
- Validate auth callbacks, email delivery, and completed/history flows in production.

## Important Context
- Prisma client has been regenerated.
- Database schema was synced with `prisma db push`.
- Existing records were backfilled for history timestamp fields.
- There is a migration SQL file for reference:
  - `prisma/migrations/20260319_history_precision/migration.sql`
- The database is not fully baselined under Prisma migration history yet.
  Post-V1, consider creating a proper migration baseline plan.

## Known Release Notes
- `npm run verify` should be re-run before shipping.
- Google Fonts build-fetch dependency was removed in favor of a local/system font stack.
- Remaining release work is mainly production secrets, hosting config, and live smoke testing.

## Nice To Revisit After V1
- Filter chip counter styling polish.
- Subtle tinted summary cards.
- Stronger completed/archive dashboard treatment.
- In-app notifications.
- Notification preferences.
- Categories/notes.
- Export/shareable summaries.

## Retrieval
- Reopen this file next session:
  - `NEXT_SESSION_TODO.md`
- Or ask:
  - `Continue from NEXT_SESSION_TODO.md`
  - `Resume production readiness and deployment prep`
