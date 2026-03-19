import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLenderRepaymentNotification } from "@/lib/email";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // next.js 15 requirement
    const { id } = await params;

    const body = await req.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        borrower: true,
        lender: true,
        transactions: true,
      },
    });

    if (!loan) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (loan.borrowerId !== session.user.id) {
      return NextResponse.json({ error: "Only the borrower can record repayments" }, { status: 403 });
    }

    if (loan.status !== "ACTIVE") {
      return NextResponse.json({ error: "Repayments can only be recorded on active loans" }, { status: 400 });
    }

    const reservedAmount = loan.transactions
      .filter((transaction) => transaction.status !== "REJECTED")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const availableOutstanding = loan.amount - reservedAmount;

    if (parseFloat(amount) > availableOutstanding) {
      return NextResponse.json({ error: "Repayment exceeds outstanding balance" }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        status: "PENDING",
        loanId: loan.id,
      },
    });

    const notification = loan.lender.email
      ? await sendLenderRepaymentNotification({
          lenderEmail: loan.lender.email,
          lenderName: loan.lender.name,
          borrowerName: loan.borrower.name,
          borrowerEmail: loan.borrower.email,
          loanId: loan.id,
          loanTitle: loan.title || "Personal Loan",
          repaymentAmount: transaction.amount,
          outstandingAmount: availableOutstanding - transaction.amount,
        })
      : { sent: false, reason: "Lender email is missing." as const };

    return NextResponse.json({ transaction, notification }, { status: 201 });
  } catch (error) {
    console.error("[api/loans/[id]/transactions:POST] Error creating transaction:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Confirm transaction endpoint could also go here as PUT or PATCH
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // This expects the transaction ID to be passed as part of the body, and the loan ID in the url
    const { id } = await params;

    const body = await req.json();
    const { transactionId, status } = body; // status should be CONFIRMED or REJECTED

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        transactions: true,
      },
    });

    if (!loan) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!["CONFIRMED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const existingTransaction = loan.transactions.find(
      (transaction) => transaction.id === transactionId
    );

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (existingTransaction.status !== "PENDING") {
      return NextResponse.json(
        { error: "This repayment has already been reviewed" },
        { status: 400 }
      );
    }

    // Only lender can confirm payments
    if (loan.lenderId !== session.user.id) {
      return NextResponse.json({ error: "Only the lender can confirm transactions" }, { status: 403 });
    }

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        reviewedAt: new Date(),
      },
    });

    if (status === "CONFIRMED") {
      const confirmedTotal = loan.transactions
        .map((entry) =>
          entry.id === transactionId ? { ...entry, status: "CONFIRMED" } : entry
        )
        .filter((entry) => entry.status === "CONFIRMED")
        .reduce((sum, entry) => sum + entry.amount, 0);

      if (confirmedTotal >= loan.amount) {
        await prisma.loan.update({
          where: { id: loan.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("[api/loans/[id]/transactions:PATCH] Error confirming transaction:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
