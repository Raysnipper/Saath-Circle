ALTER TABLE "Loan"
ALTER COLUMN "amount" TYPE DECIMAL(12, 2)
USING ROUND("amount"::numeric, 2);

ALTER TABLE "Transaction"
ALTER COLUMN "amount" TYPE DECIMAL(12, 2)
USING ROUND("amount"::numeric, 2);
