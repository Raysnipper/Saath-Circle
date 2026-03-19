# Production Readiness Review

## Current Strengths
- Core product flow exists end-to-end: create, acknowledge, repay, review, complete.
- History timestamps are now explicitly stored:
  - `Loan.acknowledgedAt`
  - `Loan.completedAt`
  - `Transaction.reviewedAt`
- Search, completed records, and history timeline are strong enough for a V1.

## Risks To Address Before Launch

### Auth / Session
- `NEXTAUTH_SECRET` must be set in production and rotated securely if compromised.
- Google OAuth callback URLs must exactly match production URLs.
- Only approved production domains should be configured in Google Cloud.

### Database / Schema
- The production database was updated via `prisma db push` because Prisma migration history was not baselined.
- This is acceptable for current V1 progress, but it should be documented so future schema changes are handled carefully.
- Recommendation:
  create a migration baseline plan after V1 so future deploys are less ambiguous.

### Email / Notifications
- Email is operationally critical because acknowledgment and repayment review depend on it.
- Failures should be observable, not silent.
- Recommendation:
  add provider-level logs and app-level error monitoring before launch.

### Build / Deploy
- The app no longer depends on remote Google Fonts during build.
- Recommendation:
  keep the current local/system font stack unless there is a strong branding reason to reintroduce hosted fonts.

### Type / Tooling
- Keep `npm run verify` and `npm run build` as the local release gate before production deploy.
- Recommendation:
  treat both as required checks before launch, not just lint/typecheck.

## Privacy / Security Notes
- The app stores personal names, emails, amounts, titles, and repayment history.
- For V1, reasonable baseline protection should include:
  - HTTPS everywhere
  - secret management through hosting platform
  - least-privilege database access
  - production backups
  - no secrets committed to repo
- Stronger field-level encryption for notes/sensitive free text can wait until after V1 unless the product scope expands.

## Recommended V1 Gate
- Do not add major new product features before launch.
- Ship once these are true:
  - auth works in production
  - emails send reliably
  - schema is in sync
  - errors are observable
  - smoke test passes with two real accounts
