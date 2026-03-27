"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Coffee } from "lucide-react";
import { NudgeDialog } from "@/components/NudgeDialog";
import { AcknowledgeLoanButton } from "@/components/AcknowledgeLoanButton";
import { RepaymentDialog } from "@/components/RepaymentDialog";
import { TransactionReviewActions } from "@/components/TransactionReviewActions";
import { Badge } from "@/components/ui/badge";
import { formatShortDate, getLastActivity } from "@/lib/loan-history";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

type Loan = {
  id: string;
  amount: number;
  title: string | null;
  status: string;
  acknowledgedAt?: Date | null;
  completedAt?: Date | null;
  lenderId: string;
  borrowerId: string;
  createdAt: Date;
  borrower: { email: string | null; name: string | null };
  lender: { email: string | null; name: string | null };
  transactions: {
    id: string;
    amount: number;
    status: string;
    createdAt: Date;
    reviewedAt?: Date | null;
  }[];
  lastNudgedAt?: Date | null;
};

function formatCurrency(amount: number) {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `\u20B9${formatted}`;
}

function toDisplayName(name?: string | null, email?: string | null) {
  const raw = (name && name.trim()) || (email ? email.split("@")[0] : "Unknown");

  return raw
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function statusTone(status: string) {
  if (status === "CONFIRMED") {
    return "border-emerald-200 bg-emerald-100 text-emerald-800";
  }
  if (status === "REJECTED") {
    return "border-rose-200 bg-rose-100 text-rose-800";
  }
  if (status === "COMPLETED") {
    return "border-stone-200 bg-stone-200 text-stone-700";
  }
  if (status === "ACTIVE") {
    return "border-sky-200 bg-sky-100 text-sky-800";
  }
  return "border-amber-200 bg-amber-100 text-amber-800";
}

function lenderPalette(seed: string) {
  const palettes = [
    {
      ring: "border-l-[6px] border-l-amber-500/70",
      avatar: "bg-amber-100 text-amber-900",
      chip: "bg-amber-100/80 text-amber-900 border-amber-200",
      meta: "border-amber-100/80 bg-white/55",
    },
    {
      ring: "border-l-[6px] border-l-teal-500/70",
      avatar: "bg-teal-100 text-teal-900",
      chip: "bg-teal-100/80 text-teal-900 border-teal-200",
      meta: "border-teal-100/80 bg-white/55",
    },
    {
      ring: "border-l-[6px] border-l-sky-500/70",
      avatar: "bg-sky-100 text-sky-900",
      chip: "bg-sky-100/80 text-sky-900 border-sky-200",
      meta: "border-sky-100/80 bg-white/55",
    },
    {
      ring: "border-l-[6px] border-l-rose-500/70",
      avatar: "bg-rose-100 text-rose-900",
      chip: "bg-rose-100/80 text-rose-900 border-rose-200",
      meta: "border-rose-100/80 bg-white/55",
    },
  ];

  const hash = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
}

function differenceInDays(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
}

export function LoanCard({
  loan,
  currentUserId,
}: {
  loan: Loan;
  currentUserId: string;
}) {
  const isLender = loan.lenderId === currentUserId;
  const isBorrower = loan.borrowerId === currentUserId;
  const isCompleted = loan.status === "COMPLETED";
  const counterpart = isLender ? loan.borrower : loan.lender;
  const counterpartName = toDisplayName(counterpart.name, counterpart.email);
  const palette = lenderPalette(counterpartName);

  const confirmedPayments = loan.transactions
    .filter((transaction) => transaction.status === "CONFIRMED")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const outstanding = loan.amount - confirmedPayments;
  const pendingRepayments = loan.transactions.filter(
    (transaction) => transaction.status === "PENDING"
  );
  const rejectedRepayments = loan.transactions.filter(
    (transaction) => transaction.status === "REJECTED"
  );
  const daysOpen = differenceInDays(loan.createdAt);
  const ageLabel = `${daysOpen} day${daysOpen === 1 ? "" : "s"}`;
  const lastActivity = getLastActivity(loan);

  const [isNudged, setIsNudged] = useState(false);

  useEffect(() => {
    let nudgedAtTime = loan.lastNudgedAt ? new Date(loan.lastNudgedAt).getTime() : 0;
    const localFallback = localStorage.getItem(`saath-nudge-${loan.id}`);
    
    if (localFallback) {
      nudgedAtTime = Math.max(nudgedAtTime, parseInt(localFallback));
    }
    
    if (nudgedAtTime > 0) {
      const hoursPassed = (Date.now() - nudgedAtTime) / (1000 * 60 * 60);
      if (hoursPassed < 24) {
        setIsNudged(true);
      }
    }
  }, [loan.id, loan.lastNudgedAt]);

  return (
    <Card
      size="sm"
      className={`dashboard-card overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl ${isCompleted ? "!bg-surface/50 opacity-80" : ""}`}
    >
      <CardHeader className="space-y-2 pb-2 sm:space-y-3">
        <div
          className={`rounded-[1.1rem] border p-2.5 sm:rounded-[1.35rem] sm:p-3 ${isCompleted ? "border-stone-200/80 bg-stone-100/70" : "border-white/60 bg-background/75"}`}
        >
          <div className="flex items-start gap-2.5">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[1rem] text-sm font-semibold sm:h-10 sm:w-10 sm:rounded-[1.1rem] ${isCompleted ? "bg-stone-200 text-stone-700" : palette.avatar}`}
            >
              {counterpartName
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className={`truncate text-[0.95rem] font-semibold sm:text-base ${isCompleted ? "text-stone-700" : "text-foreground"}`}>
                    {counterpartName}
                  </div>
                  {loan.title && (
                    <div className={`mt-0.5 line-clamp-1 text-[0.64rem] uppercase tracking-[0.13em] sm:text-[0.68rem] ${isCompleted ? "text-stone-500" : "text-muted-foreground"}`}>
                      {loan.title}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge
                    variant="outline"
                    className={`${statusTone(loan.status)} shrink-0 rounded-[0.5rem] px-2 py-1 text-[0.5rem] font-bold tracking-[0.1em] shadow-none sm:px-2.5 sm:py-1.5 sm:text-[0.55rem] uppercase text-center leading-[1.15]`}
                  >
                    {loan.status === 'PENDING' ? (
                      <span>Awaiting<br />Handshake</span>
                    ) : loan.status === 'ACTIVE' ? 'In Progress' : loan.status === 'COMPLETED' ? (
                      <span>Settled<br />w/ Grace</span>
                    ) : loan.status}
                  </Badge>
                  {loan.status === 'ACTIVE' && (
                    <NudgeDialog
                      loanId={loan.id}
                      counterpartName={counterpartName}
                      onNudged={() => setIsNudged(true)}
                    >
                      <button className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#fdf5ed] border border-[#f5eadf] text-[#2F1400] hover:bg-[#f5e6d8] transition-colors cursor-pointer group relative shadow-sm">
                        <Coffee className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${isNudged ? "text-[#E07A5F] fill-[#E07A5F]/20 animate-pulse" : ""}`} strokeWidth={2.5} />
                        {isNudged && (
                          <span className="absolute top-0 right-0 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E07A5F] opacity-75 mt-0.5 mr-0.5"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E07A5F] mt-0.5 mr-0.5"></span>
                          </span>
                        )}
                      </button>
                    </NudgeDialog>
                  )}
                </div>
              </div>

              <div className="mt-2 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <div 
                    className={`truncate text-[1.45rem] font-bold leading-none tracking-tight sm:text-[2rem] ${isCompleted ? "text-stone-700" : "text-foreground"}`}
                    title={formatCurrency(outstanding)}
                  >
                    {formatCurrency(outstanding)}
                  </div>
                  <p className={`mt-1 text-[0.68rem] sm:text-xs ${isCompleted ? "text-stone-500" : "text-muted-foreground"}`}>
                    {isCompleted ? "settled record" : "currently open"}
                  </p>
                </div>

                <div
                  className={`flex shrink-0 w-max flex-col items-center justify-center rounded-[1rem] border px-2 py-1 text-[0.5rem] font-bold uppercase leading-tight tracking-[0.1em] sm:rounded-[1.1rem] sm:text-[0.55rem] text-center ${isCompleted ? "border-stone-300 bg-stone-100 text-stone-700" : palette.chip}`}
                >
                  <span>{isLender ? "EXTENDED" : "RECEIVED"}</span>
                  <span>SUPPORT</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`rounded-[1.1rem] border px-2.5 py-2 sm:rounded-[1.35rem] sm:px-3 sm:py-2.5 ${isCompleted ? "border-stone-200 bg-stone-100/60" : palette.meta}`}
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <div className="text-[0.62rem] uppercase tracking-[0.15em] text-muted-foreground">
                Created
              </div>
              <div className="text-xs font-semibold text-foreground sm:text-sm">
                {formatShortDate(new Date(loan.createdAt))}
              </div>
            </div>
            <div className="space-y-0.5 text-right">
              <div className="text-[0.62rem] uppercase tracking-[0.15em] text-muted-foreground">
                {loan.status === "COMPLETED" ? "Status" : "Open For"}
              </div>
              <div className="text-xs font-semibold text-foreground sm:text-sm">
                {loan.status === "COMPLETED" ? "Settled" : ageLabel}
              </div>
            </div>
          </div>

          <div className="mt-2 border-t border-white/50 pt-2 sm:border-t-border/50">
            <div className="flex items-start justify-between gap-3">
              <div className="text-[0.62rem] uppercase tracking-[0.15em] text-muted-foreground">
                Last Activity
              </div>
              <div className="min-w-0 text-right">
                <div className="truncate text-xs font-semibold text-foreground sm:text-sm">
                  {lastActivity.label}
                </div>
                <div className="text-[0.68rem] text-muted-foreground">
                  {formatShortDate(lastActivity.date)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 sm:space-y-3">
        <div
          className={`rounded-[1.1rem] border px-2.5 py-2 sm:rounded-[1.35rem] sm:p-3 ${isCompleted ? "border-stone-200 bg-stone-100/50" : "border-white/60 bg-background/65"}`}
        >
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <div className="min-w-0">
              <div className={`truncate text-[0.58rem] font-bold uppercase tracking-[0.14em] ${isCompleted ? "text-stone-500" : "text-muted-foreground"}`}>
                The Support
              </div>
              <div className={`mt-1 truncate text-[0.95rem] font-semibold sm:mt-1.5 sm:text-lg ${isCompleted ? "text-stone-700" : ""}`} title={formatCurrency(loan.amount)}>
                {formatCurrency(loan.amount)}
              </div>
            </div>
            <div className="min-w-0">
              <div className={`truncate text-[0.58rem] font-bold uppercase tracking-[0.14em] ${isCompleted ? "text-stone-500" : "text-muted-foreground"}`}>
                Flowed Back
              </div>
              <div className={`mt-1 truncate text-[0.95rem] font-semibold sm:mt-1.5 sm:text-lg ${isCompleted ? "text-stone-700" : "text-emerald-600"}`} title={formatCurrency(confirmedPayments)}>
                {formatCurrency(confirmedPayments)}
              </div>
            </div>
            <div className="min-w-0">
              <div className={`truncate text-[0.58rem] font-bold uppercase tracking-[0.14em] ${isCompleted ? "text-stone-500" : "text-muted-foreground"}`}>
                Remaining
              </div>
              <div className={`mt-1 truncate text-[0.95rem] font-semibold sm:mt-1.5 sm:text-lg ${isCompleted ? "text-stone-600" : ""}`} title={formatCurrency(outstanding)}>
                {formatCurrency(outstanding)}
              </div>
            </div>
          </div>
        </div>

        {(pendingRepayments.length > 0 || rejectedRepayments.length > 0) && (
          <div className="space-y-2 border-t border-border/70 pt-2.5 sm:space-y-2.5 sm:pt-3">
            {pendingRepayments.map((transaction) => (
              <div
                key={transaction.id}
                className="space-y-2 rounded-[1.1rem] border border-amber-500/20 bg-amber-50/50 p-2.5 sm:rounded-[1.2rem] sm:p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm">
                    Repayment of{" "}
                    <span className="font-semibold">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                  <Badge variant="outline" className={statusTone(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </div>

                {isLender ? (
                  <div className="space-y-2">
                    <p className="text-xs text-amber-700">
                      Review this repayment directly here.
                    </p>
                    <TransactionReviewActions
                      loanId={loan.id}
                      transactionId={transaction.id}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-amber-700">
                    Waiting for {loan.lender.name || loan.lender.email} to approve.
                  </p>
                )}
              </div>
            ))}

            {isBorrower &&
              rejectedRepayments.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-[1.1rem] border border-rose-500/20 bg-rose-50/50 p-2.5 sm:rounded-[1.2rem] sm:p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs sm:text-sm">
                      Repayment of{" "}
                      <span className="font-semibold">
                        {formatCurrency(transaction.amount)}
                      </span>{" "}
                      was rejected.
                    </div>
                    <Badge variant="outline" className={statusTone(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>

      <CardFooter
        className={`flex justify-end gap-2 pt-2.5 sm:pt-3 ${isCompleted ? "bg-stone-100/40" : "bg-gradient-to-r from-white/40 to-white/10"}`}
      >
        {isCompleted && (
          <Link
            href={`/loan/${loan.id}`}
            className="inline-flex w-full items-center justify-center rounded-full border border-outline-variant/30 bg-white/60 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface/60 transition hover:bg-white hover:text-primary sm:w-auto"
          >
            View History
          </Link>
        )}
        {loan.status === "PENDING" && isBorrower && (
          <AcknowledgeLoanButton loanId={loan.id} />
        )}
        {loan.status === "PENDING" && isLender && (
          <p className="w-full rounded-[1.1rem] border border-amber-500/15 bg-amber-50/50 px-3 py-2 text-center text-xs text-amber-700 sm:rounded-[1.2rem] sm:py-2.5">
            Waiting for the other person to review this record.
          </p>
        )}
        {loan.status === "ACTIVE" && isBorrower && outstanding > 0 && (
          <RepaymentDialog
            loanId={loan.id}
            outstanding={outstanding}
            counterpartyName={loan.lender.name || loan.lender.email || "the other person"}
          />
        )}
      </CardFooter>
    </Card>
  );
}
