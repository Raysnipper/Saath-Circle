import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNudgeNotification } from "@/lib/email";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = await params;

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        borrower: true,
        lender: true,
      },
    });

    if (!loan) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isLender = loan.lenderId === session.user.id;
    const isBorrower = loan.borrowerId === session.user.id;

    if (!isLender && !isBorrower) {
      return NextResponse.json({ error: "Not authorized to nudge this loan" }, { status: 403 });
    }

    const senderUser = isLender ? loan.lender : loan.borrower;
    const receiverUser = isLender ? loan.borrower : loan.lender;

    const updated = await prisma.loan.update({
      where: { id },
      data: {
        lastNudgedAt: new Date(),
      },
    });

    const notification = receiverUser.email
      ? await sendNudgeNotification({
          receiverEmail: receiverUser.email,
          receiverName: receiverUser.name,
          senderEmail: senderUser.email,
          senderName: senderUser.name,
          loanId: loan.id,
          loanTitle: loan.title,
          amount: loan.amount,
        })
      : { sent: false, reason: "Receiver email is missing." as const };

    return NextResponse.json({ loan: updated, notification });
  } catch (error) {
    console.error("[api/loans/[id]/nudge:POST] Error sending nudge:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
