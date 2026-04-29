import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { hashInvitationToken, isInvitationExpired, normalizeEmail } from "@/lib/invitations";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;
    const invitation = await prisma.loanInvitation.findUnique({
      where: { tokenHash: hashInvitationToken(token) },
      include: {
        loan: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (isInvitationExpired(invitation.expiresAt)) {
      return NextResponse.json({ error: "This invitation has expired" }, { status: 410 });
    }

    const invitedEmail = normalizeEmail(invitation.email);
    const sessionEmail = normalizeEmail(session.user.email);

    if (invitedEmail !== sessionEmail) {
      return NextResponse.json(
        {
          error: `This invitation was sent to ${invitedEmail}. Please sign in with that Google account.`,
        },
        { status: 403 }
      );
    }

    if (invitation.acceptedAt && invitation.acceptedById !== session.user.id) {
      return NextResponse.json(
        { error: "This invitation has already been accepted" },
        { status: 409 }
      );
    }

    if (
      invitation.loan.borrowerId &&
      invitation.loan.borrowerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "This invitation is already connected to another account" },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      prisma.loan.update({
        where: { id: invitation.loanId },
        data: {
          borrowerId: session.user.id,
          borrowerEmail: invitedEmail,
        },
      }),
      prisma.loanInvitation.update({
        where: { id: invitation.id },
        data: {
          acceptedAt: invitation.acceptedAt ?? new Date(),
          acceptedById: session.user.id,
        },
      }),
    ]);

    return NextResponse.json({ loanId: invitation.loanId });
  } catch (error) {
    console.error("[api/invitations/[token]/claim:POST] Error claiming invitation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
