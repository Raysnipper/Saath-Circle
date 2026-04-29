import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { authOptions } from "@/lib/auth";
import { normalizeEmail } from "@/lib/invitations";
import { prisma } from "@/lib/prisma";

export default async function LegacyBorrowerAcknowledgeEntry({
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

  if (
    session?.user?.id &&
    (session.user.id === loan.borrowerId || session.user.id === loan.lenderId)
  ) {
    redirect(`/loan/${loan.id}`);
  }

  const invitedEmail = normalizeEmail(loan.borrowerEmail || loan.borrower?.email || "");
  const sessionEmail = session?.user?.email ? normalizeEmail(session.user.email) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Nav />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-2xl border bg-card p-8 shadow-sm space-y-5">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Legacy Invite Link
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              This invite link needs to be refreshed
            </h1>
            <p className="text-muted-foreground">
              This older invitation was intended for{" "}
              <span className="font-medium text-foreground">{invitedEmail}</span>.
            </p>
          </div>

          {sessionEmail ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 p-4 text-sm">
              You are currently signed in as{" "}
              <span className="font-medium">{sessionEmail}</span>.
            </div>
          ) : null}

          <p className="text-sm text-muted-foreground">
            For privacy, loan details are now opened through secure invitation
            links. Ask the sender to create or resend the handshake invitation.
          </p>
        </div>
      </main>
    </div>
  );
}
