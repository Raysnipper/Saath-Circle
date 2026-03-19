# Production Smoke Test

## Accounts
- Use two real test accounts:
  - lender account
  - borrower account

## Core Flow
1. Sign in as lender.
2. Create a new record for the borrower.
3. Confirm the borrower receives the email.
4. Open the borrower link and sign in as borrower.
5. Acknowledge the record.
6. Confirm lender sees the record become active.
7. Submit a partial repayment as borrower.
8. Confirm lender sees the pending repayment.
9. Confirm the repayment as lender.
10. Submit a final repayment as borrower.
11. Confirm the final repayment as lender.
12. Confirm the record moves into `Completed`.

## Dashboard Checks
- Search by borrower name.
- Search by title.
- Check `Needs Action`, `Active`, and `Completed` filters.
- Confirm `Last activity` updates after acknowledgment and repayments.
- Open a completed record via `View History`.

## History Checks
- Confirm record creation timestamp.
- Confirm acknowledgment timestamp.
- Confirm repayment submitted timestamps.
- Confirm repayment reviewed timestamps.
- Confirm settled/completed timestamp.

## Navigation Checks
- Clicking `Saath Circle` returns to dashboard.
- `Back to Records` returns to dashboard from history page.
- Sign out works.

## Failure Checks
- Submit repayment that exceeds outstanding amount.
- Re-open a completed record history page directly.
- Verify unauthorized users cannot access someone else’s record URL.
