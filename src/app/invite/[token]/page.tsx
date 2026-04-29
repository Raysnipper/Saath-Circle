import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { InviteAccessButton } from "@/components/InviteAccessButton";
import { Nav } from "@/components/Nav";
import { authOptions } from "@/lib/auth";
import { hashInvitationToken, isInvitationExpired, normalizeEmail } from "@/lib/invitations";
import { prisma } from "@/lib/prisma";

function formatCurrency(amount: number) {
  return `\u20B9${amount.toFixed(2)}`;
}

function displayName(name?: string | null, email?: string | null) {
  return name || email || "Someone";
}

export default async function InviteEntry({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getServerSession(authOptions);
  const invitation = await prisma.loanInvitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    include: {
      loan: {
        include: {
          lender: true,
          borrower: true,
        },
      },
    },
  });

  if (!invitation) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Nav />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm">
            <h1 className="text-3xl font-bold tracking-tight">Invite not found</h1>
            <p className="mt-3 text-muted-foreground">
              This link may be incomplete or no longer available.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const invitedEmail = normalizeEmail(invitation.email);
  const sessionEmail = session?.user?.email
    ? normalizeEmail(session.user.email)
    : null;
  const expired = isInvitationExpired(invitation.expiresAt);
  const canClaim = Boolean(sessionEmail && sessionEmail === invitedEmail && !expired);
  const alreadyConnected =
    session?.user?.id && invitation.loan.borrowerId === session.user.id;

  if (alreadyConnected) {
    redirect(`/loan/${invitation.loan.id}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Nav />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-2xl border bg-card p-8 shadow-sm space-y-5">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Private Invitation
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              Review a Saath Circle handshake
            </h1>
            <p className="text-muted-foreground">
              This invitation was sent to{" "}
              <span className="font-medium text-foreground">{invitedEmail}</span>.
            </p>
          </div>

          {expired ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-50/50 p-4 text-sm text-rose-800">
              This invitation has expired. Ask the sender to create a fresh
              handshake or resend the invitation.
            </div>
          ) : null}

          {sessionEmail && sessionEmail !== invitedEmail ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 p-4 text-sm">
              You are signed in as{" "}
              <span className="font-medium">{sessionEmail}</span>. Switch to the
              invited Google account to continue.
            </div>
          ) : null}

          {canClaim || alreadyConnected ? (
            <div className="rounded-xl border bg-muted/30 p-5 space-y-2">
              <p>
                <span className="font-medium">Lender:</span>{" "}
                {displayName(invitation.loan.lender.name, invitation.loan.lender.email)}
              </p>
              <p>
                <span className="font-medium">Loan:</span>{" "}
                {invitation.loan.title || "Personal Loan"}
              </p>
              <p>
                <span className="font-medium">Amount:</span>{" "}
                {formatCurrency(invitation.loan.amount)}
              </p>
              <p>
                <span className="font-medium">Status:</span>{" "}
                {invitation.loan.status}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sign in with the invited Google account before the loan details are shown.
            </p>
          )}

          <InviteAccessButton
            token={token}
            invitedEmail={invitedEmail}
            sessionEmail={sessionEmail}
            canClaim={canClaim}
          />
        </div>
      </main>
    </div>
  );
}
