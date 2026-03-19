import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLenderAcknowledgementNotification } from "@/lib/email";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // next.js 15 requires awaiting params
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

    if (loan.borrowerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to acknowledge this loan" }, { status: 403 });
    }

    const updated = await prisma.loan.update({
      where: { id },
      data: {
        status: "ACTIVE",
        acknowledgedAt: loan.acknowledgedAt ?? new Date(),
      },
    });

    const notification = loan.lender.email
      ? await sendLenderAcknowledgementNotification({
          lenderEmail: loan.lender.email,
          lenderName: loan.lender.name,
          borrowerName: loan.borrower.name,
          borrowerEmail: loan.borrower.email,
          loanId: loan.id,
          loanTitle: loan.title || "Personal Loan",
          amount: loan.amount,
        })
      : { sent: false, reason: "Lender email is missing." as const };

    return NextResponse.json({ loan: updated, notification });
  } catch (error) {
    console.error("[api/loans/[id]/acknowledge:POST] Error acknowledging loan:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
