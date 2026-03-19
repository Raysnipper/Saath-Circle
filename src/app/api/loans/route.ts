import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBorrowerLoanNotification } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, title, borrowerEmail } = body;

    // Optional validation
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (!borrowerEmail || borrowerEmail === session.user.email) {
      return NextResponse.json({ error: "Invalid borrower email" }, { status: 400 });
    }

    // Attempt to find the borrower user by email
    // If they aren't registered yet, we could either reject or create a shadow user
    // For now let's just create a shadow user or require them to register first.
    // Given the simplicity, requiring registration is safer for MVP.
    let borrower = await prisma.user.findUnique({
      where: { email: borrowerEmail },
    });

    if (!borrower) {
      // In a real 2026 app, you might send an email invitation here!
      // But for our MVP we will create a placeholder user account for them
      borrower = await prisma.user.create({
        data: {
          email: borrowerEmail,
          name: borrowerEmail.split("@")[0],
        },
      });
    }

    const loan = await prisma.loan.create({
      data: {
        amount: parseFloat(amount),
        title: title || "Personal Loan",
        status: "PENDING", // PENDING ACKNOWLEDGMENT
        lenderId: session.user.id,
        borrowerId: borrower.id,
      },
    });

    const notification = await sendBorrowerLoanNotification({
      borrowerEmail: borrower.email || borrowerEmail,
      borrowerName: borrower.name,
      lenderName: session.user.name,
      lenderEmail: session.user.email,
      loanId: loan.id,
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
        include: { borrower: true, transactions: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(loans);
    } else if (type === "received") {
      const loans = await prisma.loan.findMany({
        where: { borrowerId: session.user.id },
        include: { lender: true, transactions: true },
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
