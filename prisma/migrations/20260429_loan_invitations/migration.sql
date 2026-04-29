ALTER TABLE "Loan" ADD COLUMN "borrowerEmail" TEXT;

UPDATE "Loan"
SET "borrowerEmail" = "User"."email"
FROM "User"
WHERE "Loan"."borrowerId" = "User"."id";

UPDATE "Loan"
SET "borrowerEmail" = ''
WHERE "borrowerEmail" IS NULL;

ALTER TABLE "Loan" ALTER COLUMN "borrowerEmail" SET NOT NULL;
ALTER TABLE "Loan" ALTER COLUMN "borrowerId" DROP NOT NULL;

UPDATE "Loan"
SET "borrowerId" = NULL
WHERE "borrowerId" IN (
    SELECT u."id"
    FROM "User" u
    WHERE NOT EXISTS (
        SELECT 1
        FROM "Account" a
        WHERE a."userId" = u."id"
    )
);

DELETE FROM "User" u
WHERE NOT EXISTS (
    SELECT 1
    FROM "Account" a
    WHERE a."userId" = u."id"
)
AND NOT EXISTS (
    SELECT 1
    FROM "Session" s
    WHERE s."userId" = u."id"
)
AND NOT EXISTS (
    SELECT 1
    FROM "Loan" l
    WHERE l."lenderId" = u."id" OR l."borrowerId" = u."id"
);

CREATE TABLE "LoanInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loanId" TEXT NOT NULL,
    "acceptedById" TEXT,

    CONSTRAINT "LoanInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LoanInvitation_tokenHash_key" ON "LoanInvitation"("tokenHash");
CREATE INDEX "LoanInvitation_email_idx" ON "LoanInvitation"("email");
CREATE INDEX "LoanInvitation_loanId_idx" ON "LoanInvitation"("loanId");

ALTER TABLE "LoanInvitation" ADD CONSTRAINT "LoanInvitation_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoanInvitation" ADD CONSTRAINT "LoanInvitation_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
