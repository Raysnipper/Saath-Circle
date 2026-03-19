ALTER TABLE "Loan"
ADD COLUMN "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN "completedAt" TIMESTAMP(3);

ALTER TABLE "Transaction"
ADD COLUMN "reviewedAt" TIMESTAMP(3);

UPDATE "Loan"
SET "acknowledgedAt" = COALESCE(
  "acknowledgedAt",
  (
    SELECT MIN(t."createdAt")
    FROM "Transaction" t
    WHERE t."loanId" = "Loan"."id"
  ),
  "createdAt"
)
WHERE "status" IN ('ACTIVE', 'COMPLETED')
  AND "acknowledgedAt" IS NULL;

UPDATE "Transaction"
SET "reviewedAt" = "createdAt"
WHERE "status" IN ('CONFIRMED', 'REJECTED')
  AND "reviewedAt" IS NULL;

UPDATE "Loan"
SET "completedAt" = COALESCE(
  "completedAt",
  (
    SELECT MAX(COALESCE(t."reviewedAt", t."createdAt"))
    FROM "Transaction" t
    WHERE t."loanId" = "Loan"."id"
      AND t."status" = 'CONFIRMED'
  ),
  "acknowledgedAt",
  "createdAt"
)
WHERE "status" = 'COMPLETED'
  AND "completedAt" IS NULL;
