import type { Prisma } from "@prisma/client";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AcknowledgeLoanButton } from "@/components/AcknowledgeLoanButton";
import { RepaymentDialog } from "@/components/RepaymentDialog";
import { TransactionReviewActions } from "@/components/TransactionReviewActions";
import { authOptions } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

type LoanWithRelations = Prisma.LoanGetPayload<{
  include: {
    borrower: true;
    lender: true;
    transactions: true;
  };
}>;

type TimelineEvent = {
  id: string;
  title: string;
  timestamp: Date | null;
  description: string;
  tone: "primary" | "emerald" | "rose" | "amber" | "stone";
  badge?: string;
  actions?: ReactNode;
};

function displayName(name?: string | null, email?: string | null) {
  const raw = (name && name.trim()) || (email ? email.split("@")[0] : "Unknown");
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatCurrency(amount: number) {
  return `\u20B9${amount.toFixed(2)}`;
}

function statusTone(status: string) {
  if (status === "CONFIRMED") return "border-emerald-200 bg-emerald-100 text-emerald-800";
  if (status === "REJECTED") return "border-rose-200 bg-rose-100 text-rose-800";
  if (status === "COMPLETED") return "border-stone-200 bg-stone-200 text-stone-700";
  if (status === "ACTIVE") return "border-sky-200 bg-sky-100 text-sky-800";
  return "border-amber-200 bg-amber-100 text-amber-800";
}

function eventToneClasses(tone: TimelineEvent["tone"]) {
  if (tone === "emerald") {
    return {
      dot: "bg-emerald-500/70",
      panel: "border-emerald-500/15 bg-emerald-500/8 text-emerald-800",
    };
  }
  if (tone === "rose") {
    return {
      dot: "bg-rose-500/70",
      panel: "border-rose-500/15 bg-rose-500/8 text-rose-800",
    };
  }
  if (tone === "amber") {
    return {
      dot: "bg-amber-500/70",
      panel: "border-amber-500/15 bg-amber-500/8 text-amber-800",
    };
  }
  if (tone === "stone") {
    return {
      dot: "bg-stone-400/80",
      panel: "border-stone-300/60 bg-stone-100/70 text-stone-700",
    };
  }
  return {
    dot: "bg-primary/50",
    panel: "border-border/70 bg-muted/25 text-muted-foreground",
  };
}

function formatTimestamp(date: Date | null) {
  if (!date) return "Timing was not captured in this version.";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default async function LoanTimeline({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const { id } = await params;

  const loan: LoanWithRelations | null = await prisma.loan.findUnique({
    where: { id },
    include: {
      borrower: true,
      lender: true,
      transactions: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!loan) {
    return <div className="p-8 text-center">Record not found.</div>;
  }

  if (loan.lenderId !== session.user.id && loan.borrowerId !== session.user.id) {
    return <div className="p-8 text-center">Unauthorized.</div>;
  }

  const confirmedPayments = loan.transactions
    .filter((transaction) => transaction.status === "CONFIRMED")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const outstanding = loan.amount - confirmedPayments;
  const isBorrower = loan.borrowerId === session.user.id;
  const isLender = loan.lenderId === session.user.id;
  const roleLabel = isBorrower ? "Borrower View" : "Lender View";
  const lenderName = displayName(loan.lender.name, loan.lender.email);
  const borrowerName = displayName(loan.borrower.name, loan.borrower.email);
  const otherPerson = isBorrower ? loan.lender : loan.borrower;
  const otherPersonName = displayName(otherPerson.name, otherPerson.email);

  const timelineEvents: TimelineEvent[] = [
    {
      id: "created",
      title: "Record Created",
      timestamp: loan.createdAt,
      description: `${lenderName} recorded a shared balance with ${borrowerName} for ${formatCurrency(loan.amount)}.`,
      tone: "primary",
    },
  ];

  if (loan.acknowledgedAt) {
    timelineEvents.push({
      id: "acknowledged",
      title: "Record Acknowledged",
      timestamp: loan.acknowledgedAt,
      description: `${borrowerName} acknowledged the shared record and it became active.`,
      tone: "emerald",
      badge: "ACTIVE",
    });
  }

  loan.transactions.forEach((transaction) => {
    const repaymentActor = borrowerName;

    timelineEvents.push({
      id: `${transaction.id}-submitted`,
      title: "Repayment Submitted",
      timestamp: transaction.createdAt,
      description: `${repaymentActor} submitted ${formatCurrency(transaction.amount)} for review.`,
      tone: transaction.status === "PENDING" ? "amber" : "primary",
      badge: "PENDING",
    });

    if (transaction.status !== "PENDING") {
      timelineEvents.push({
        id: `${transaction.id}-reviewed`,
        title:
          transaction.status === "CONFIRMED"
            ? "Repayment Confirmed"
            : "Repayment Rejected",
        timestamp: transaction.reviewedAt,
        description:
          transaction.status === "CONFIRMED"
            ? `${lenderName} confirmed the repayment of ${formatCurrency(transaction.amount)}.`
            : `${lenderName} rejected the repayment of ${formatCurrency(transaction.amount)}.`,
        tone: transaction.status === "CONFIRMED" ? "emerald" : "rose",
        badge: transaction.status,
      });
    } else if (isLender) {
      timelineEvents[timelineEvents.length - 1] = {
        ...timelineEvents[timelineEvents.length - 1],
        actions: (
          <TransactionReviewActions
            loanId={loan.id}
            transactionId={transaction.id}
          />
        ),
      };
    }
  });

  if (loan.completedAt) {
    timelineEvents.push({
      id: "settled",
      title: "Record Settled",
      timestamp: loan.completedAt,
      description: `This shared balance has been fully settled. No open amount remains between ${lenderName} and ${borrowerName}.`,
      tone: "stone",
      badge: "COMPLETED",
    });
  }

  return (
    <div className="min-h-screen flex flex-col text-foreground">
      <Nav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="space-y-5 sm:space-y-6">
          <header className="rounded-[1.75rem] border border-white/70 bg-white/60 p-5 shadow-[0_16px_40px_rgba(93,72,52,0.08)] backdrop-blur-sm sm:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {roleLabel}
            </p>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-white/70 px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Records
                </Link>
                <div>
                  <h1 className="font-brand text-4xl font-semibold leading-none text-foreground sm:text-5xl">
                    {loan.title || "Shared Record"}
                  </h1>
                  <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                    With{" "}
                    <span className="font-semibold text-foreground">
                      {otherPersonName}
                    </span>
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`${statusTone(loan.status)} rounded-full px-3 py-1 text-[0.68rem] tracking-[0.16em] sm:text-[0.72rem]`}
              >
                {loan.status}
              </Badge>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Created on{" "}
              {new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(
                new Date(loan.createdAt)
              )}
            </p>
          </header>

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            <Card className="col-span-2 rounded-[1.5rem] border-white/70 bg-white/70 shadow-[0_14px_36px_rgba(93,72,52,0.07)] backdrop-blur-sm sm:col-span-1">
              <CardHeader className="py-4">
                <CardTitle className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-sans text-[2rem] font-bold leading-none tracking-tight tabular-nums sm:text-[2.2rem]">
                  {formatCurrency(loan.amount)}
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem] border-white/70 bg-white/70 shadow-[0_14px_36px_rgba(93,72,52,0.07)] backdrop-blur-sm">
              <CardHeader className="py-4">
                <CardTitle className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Repaid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-sans text-[1.7rem] font-bold leading-none tracking-tight tabular-nums text-emerald-600 sm:text-[2.2rem]">
                  {formatCurrency(confirmedPayments)}
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem] border-white/70 bg-white/70 shadow-[0_14px_36px_rgba(93,72,52,0.07)] backdrop-blur-sm">
              <CardHeader className="py-4">
                <CardTitle className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Open
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-sans text-[1.7rem] font-bold leading-none tracking-tight tabular-nums sm:text-[2.2rem]">
                  {formatCurrency(outstanding)}
                </div>
              </CardContent>
            </Card>
          </div>

          {loan.status === "PENDING" && isBorrower && (
            <div className="flex justify-end">
              <AcknowledgeLoanButton loanId={loan.id} />
            </div>
          )}

          {loan.status === "ACTIVE" && isBorrower && outstanding > 0 && (
            <div className="flex justify-end">
              <RepaymentDialog
                loanId={loan.id}
                outstanding={outstanding}
                counterpartyName={displayName(loan.lender.name, loan.lender.email)}
              />
            </div>
          )}

          <section className="rounded-[1.75rem] border border-white/70 bg-white/60 p-5 shadow-[0_16px_40px_rgba(93,72,52,0.08)] backdrop-blur-sm sm:p-6">
            <div>
              <h2 className="font-brand text-3xl font-semibold sm:text-4xl">
                History
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                A record of how this balance moved over time, from creation to repayment review and final settlement.
              </p>
            </div>

            <div className="relative mt-6 space-y-4 border-l-2 border-border/70 pl-4 sm:space-y-5">
              {timelineEvents.map((event) => {
                const toneClasses = eventToneClasses(event.tone);

                return (
                  <div key={event.id} className="relative">
                    <div
                      className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full ring-4 ring-background ${toneClasses.dot}`}
                    />
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {event.title}
                        </span>
                        {event.badge ? (
                          <Badge variant="outline" className={statusTone(event.badge)}>
                            {event.badge}
                          </Badge>
                        ) : null}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(event.timestamp)}
                      </span>
                      <div
                        className={`mt-1 rounded-[1rem] border p-3 text-sm ${toneClasses.panel}`}
                      >
                        {event.description}
                      </div>
                      {event.actions ? <div className="mt-1">{event.actions}</div> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
