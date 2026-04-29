import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLenderRepaymentNotification } from "@/lib/email";
import { moneyToNumber } from "@/lib/money";
import { createRepaymentSchema, reviewTransactionSchema } from "@/lib/validation";

type LoanTransaction = {
  id: string;
  amount: Prisma.Decimal;
  status: string;
};

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

    const body = createRepaymentSchema.safeParse(await req.json());

    if (!body.success) {
      return NextResponse.json(
        { error: body.error.issues[0]?.message || "Invalid repayment amount" },
        { status: 400 }
      );
    }

    const { amount } = body.data;

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
      .filter((transaction: LoanTransaction) => transaction.status !== "REJECTED")
      .reduce((sum: number, transaction: LoanTransaction) => sum + moneyToNumber(transaction.amount), 0);

    const availableOutstanding = moneyToNumber(loan.amount) - reservedAmount;

    if (Number(amount) > availableOutstanding) {
      return NextResponse.json({ error: "Repayment exceeds outstanding balance" }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        status: "PENDING",
        loanId: loan.id,
      },
    });

    const notification = loan.lender.email
      ? await sendLenderRepaymentNotification({
          lenderEmail: loan.lender.email,
          lenderName: loan.lender.name,
          borrowerName: loan.borrower?.name,
          borrowerEmail: loan.borrower?.email || loan.borrowerEmail,
          loanId: loan.id,
          loanTitle: loan.title || "Shared Record",
          repaymentAmount: moneyToNumber(transaction.amount),
          outstandingAmount: availableOutstanding - moneyToNumber(transaction.amount),
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

    const body = reviewTransactionSchema.safeParse(await req.json());

    if (!body.success) {
      return NextResponse.json(
        { error: body.error.issues[0]?.message || "Invalid review details" },
        { status: 400 }
      );
    }

    const { transactionId, status } = body.data;

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
      (transaction: LoanTransaction) => transaction.id === transactionId
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

    // Only the person who sent support can confirm payments.
    if (loan.lenderId !== session.user.id) {
      return NextResponse.json({ error: "Only the person who sent support can confirm repayments" }, { status: 403 });
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
        .map((entry: LoanTransaction) =>
          entry.id === transactionId ? { ...entry, status: "CONFIRMED" } : entry
        )
        .filter((entry: LoanTransaction) => entry.status === "CONFIRMED")
        .reduce((sum: number, entry: LoanTransaction) => sum + moneyToNumber(entry.amount), 0);

      if (confirmedTotal >= moneyToNumber(loan.amount)) {
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
