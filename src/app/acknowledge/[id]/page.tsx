import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { BorrowerAccessButton } from "@/components/BorrowerAccessButton";
import { Nav } from "@/components/Nav";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function BorrowerAcknowledgeEntry({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      borrower: true,
      lender: true,
    },
  });

  if (!loan) {
    return <div className="p-8 text-center">Loan not found.</div>;
  }

  if (session?.user?.email === loan.borrower.email) {
    redirect(`/loan/${loan.id}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Nav />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-2xl border bg-card p-8 shadow-sm space-y-5">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Borrower Access
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              Review and acknowledge this loan
            </h1>
            <p className="text-muted-foreground">
              This invitation is intended for{" "}
              <span className="font-medium text-foreground">
                {loan.borrower.email}
              </span>
              .
            </p>
          </div>

          <div className="rounded-xl border bg-muted/30 p-5 space-y-2">
            <p>
              <span className="font-medium">Lender:</span>{" "}
              {loan.lender.name || loan.lender.email}
            </p>
            <p>
              <span className="font-medium">Loan:</span>{" "}
              {loan.title || "Personal Loan"}
            </p>
            <p>
              <span className="font-medium">Amount:</span> ₹{loan.amount.toFixed(2)}
            </p>
            <p>
              <span className="font-medium">Status:</span> {loan.status}
            </p>
          </div>

          {session?.user?.email ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 p-4 text-sm">
              You are currently signed in as{" "}
              <span className="font-medium">{session.user.email}</span>. Continue
              below to sign out first if this is not the borrower account.
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Continue with the borrower&apos;s Google account to review this loan.
            </p>
          )}

          <BorrowerAccessButton
            loanId={loan.id}
            borrowerEmail={loan.borrower.email || ""}
          />
        </div>
      </main>
    </div>
  );
}
