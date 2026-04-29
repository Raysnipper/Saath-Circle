import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBorrowerLoanNotification } from "@/lib/email";
import {
  createInvitationToken,
  hashInvitationToken,
  invitationExpiresAt,
  normalizeEmail,
} from "@/lib/invitations";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, title, borrowerEmail } = body;
    const normalizedBorrowerEmail =
      typeof borrowerEmail === "string" ? normalizeEmail(borrowerEmail) : "";
    const sessionEmail = session.user.email
      ? normalizeEmail(session.user.email)
      : "";

    // Optional validation
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (!normalizedBorrowerEmail || normalizedBorrowerEmail === sessionEmail) {
      return NextResponse.json({ error: "Invalid borrower email" }, { status: 400 });
    }

    const borrower = await prisma.user.findUnique({
      where: { email: normalizedBorrowerEmail },
      include: { accounts: true },
    });
    const registeredBorrowerId = borrower?.accounts.length ? borrower.id : null;
    const inviteToken = createInvitationToken();

    const loan = await prisma.loan.create({
      data: {
        amount: parseFloat(amount),
        title: title || "Personal Loan",
        status: "PENDING", // PENDING ACKNOWLEDGMENT
        lenderId: session.user.id,
        borrowerId: registeredBorrowerId,
        borrowerEmail: normalizedBorrowerEmail,
        invitations: {
          create: {
            email: normalizedBorrowerEmail,
            tokenHash: hashInvitationToken(inviteToken),
            expiresAt: invitationExpiresAt(),
          },
        },
      },
    });

    const notification = await sendBorrowerLoanNotification({
      borrowerEmail: normalizedBorrowerEmail,
      borrowerName: borrower?.name,
      lenderName: session.user.name,
      lenderEmail: session.user.email,
      inviteToken,
      loanTitle: loan.title || "Personal Loan",
      amount: loan.amount,
    });

    return NextResponse.json({ loan, notification }, { status: 201 });
  } catch (error) {
    console.error("[api/loans:POST] Error creating loan:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "given" or "received"

    if (type === "given") {
      const loans = await prisma.loan.findMany({
        where: { lenderId: session.user.id },
        include: { borrower: true, lender: true, transactions: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(loans);
    } else if (type === "received") {
      const loans = await prisma.loan.findMany({
        where: { borrowerId: session.user.id },
        include: { borrower: true, lender: true, transactions: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(loans);
    }

    // All active/pending loans for user
    const loans = await prisma.loan.findMany({
      where: {
        OR: [
          { lenderId: session.user.id },
          { borrowerId: session.user.id }
        ]
      },
      include: { borrower: true, lender: true, transactions: true },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(loans);

  } catch (error) {
    console.error("[api/loans:GET] Error fetching loans:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
