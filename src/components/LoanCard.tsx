"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Coffee, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NudgeDialog } from "@/components/NudgeDialog";
import { AcknowledgeLoanButton } from "@/components/AcknowledgeLoanButton";
import { RepaymentDialog } from "@/components/RepaymentDialog";
import { TransactionReviewActions } from "@/components/TransactionReviewActions";
import { Badge } from "@/components/ui/badge";
import { formatShortDate, getLastActivity } from "@/lib/loan-history";
import { formatCurrency } from "@/lib/money";
import { Card } from "@/components/ui/card";

type Loan = {
  id: string;
  amount: number;
  title: string | null;
  status: string;
  acknowledgedAt?: Date | null;
  completedAt?: Date | null;
  lenderId: string;
  borrowerId: string | null;
  borrowerEmail: string;
  createdAt: Date;
  borrower: { email: string | null; name: string | null } | null;
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
  const borrowerEmail = loan.borrower?.email || loan.borrowerEmail;
  const borrowerName = toDisplayName(loan.borrower?.name, borrowerEmail);
  const lenderName = toDisplayName(loan.lender.name, loan.lender.email);
  const counterpartName = isLender ? borrowerName : lenderName;
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
  const [isExpanded, setIsExpanded] = useState(false);

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

  const percentRepaid =
    loan.amount > 0
      ? Math.min(100, Math.max(0, Math.round((confirmedPayments / loan.amount) * 100)))
      : 0;

  return (
    <Card
      size="sm"
      className={`dashboard-card overflow-hidden transition-all hover:shadow-lg ${isCompleted ? "!bg-surface/50 opacity-85" : ""}`}
    >
      {/* Clickable Header for Collapsing/Expanding */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded((prev) => !prev);
          }
        }}
        className="cursor-pointer select-none p-3.5 sm:p-4 transition-colors hover:bg-black/[0.02]"
      >
        <div className="flex items-start gap-2.5">
          {/* Avatar */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[1.1rem] text-sm font-semibold sm:h-11 sm:w-11 sm:rounded-[1.2rem] ${isCompleted ? "bg-stone-200 text-stone-700" : palette.avatar}`}
          >
            {counterpartName
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase()}
          </div>

          {/* Main Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className={`truncate text-[0.95rem] font-bold sm:text-base ${isCompleted ? "text-stone-700" : "text-foreground"}`}>
                  {counterpartName}
                </div>
                {loan.title && (
                  <div className={`mt-0.5 line-clamp-1 text-[0.65rem] uppercase tracking-[0.13em] sm:text-[0.68rem] ${isCompleted ? "text-stone-500" : "text-muted-foreground"}`}>
                    {loan.title}
                  </div>
                )}
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Badge
                  variant="outline"
                  className={`${statusTone(loan.status)} shrink-0 rounded-[0.5rem] px-2 py-1 text-[0.5rem] font-bold tracking-[0.1em] shadow-none sm:px-2.5 sm:py-1 sm:text-[0.55rem] uppercase text-center leading-[1.15]`}
                >
                  {loan.status === 'PENDING' ? (
                    <span>Awaiting Handshake</span>
                  ) : loan.status === 'ACTIVE' ? (
                    'In Progress'
                  ) : loan.status === 'COMPLETED' ? (
                    <span>Settled w/ Grace</span>
                  ) : (
                    loan.status
                  )}
                </Badge>

                {(loan.status === 'ACTIVE' || loan.status === 'PENDING') && (
                  <NudgeDialog
                    loanId={loan.id}
                    counterpartName={counterpartName}
                    onNudged={() => setIsNudged(true)}
                  >
                    <button
                      type="button"
                      aria-label="Nudge reminder"
                      className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#fdf5ed] border border-[#f5eadf] text-[#2F1400] hover:bg-[#f5e6d8] transition-colors cursor-pointer group relative shadow-sm"
                    >
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

                {/* Chevron Toggle Indicator */}
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180 bg-stone-100" : ""}`}>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Amount & Extended/Received Pill */}
            <div className="mt-2 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <div
                  className={`truncate text-[1.4rem] font-bold leading-none tracking-tight sm:text-[1.85rem] ${isCompleted ? "text-stone-700" : "text-foreground"}`}
                  title={formatCurrency(outstanding)}
                >
                  {formatCurrency(outstanding)}
                </div>
                <p className={`mt-1 text-[0.65rem] sm:text-xs ${isCompleted ? "text-stone-500" : "text-muted-foreground"}`}>
                  {isCompleted ? "settled record" : "currently open"}
                </p>
              </div>

              <div
                className={`flex shrink-0 w-max items-center justify-center rounded-full border px-2.5 py-0.5 text-[0.52rem] font-bold uppercase tracking-[0.12em] sm:text-[0.58rem] text-center ${isCompleted ? "border-stone-300 bg-stone-100 text-stone-700" : palette.chip}`}
              >
                <span>{isLender ? "EXTENDED" : "RECEIVED"} SUPPORT</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Details Container */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border/60"
          >
            <div className="space-y-3 p-3.5 sm:p-4 pt-2">
              {/* Metadata Box (Created, Open For, Last Activity) */}
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

              {/* Financial Breakdown Box (Total, Repaid, Open) */}
              <div
                className={`rounded-[1.1rem] border px-2.5 py-2.5 sm:rounded-[1.35rem] sm:p-3.5 ${isCompleted ? "border-stone-200 bg-stone-100/50" : "border-white/60 bg-background/65"}`}
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
                  <div className="min-w-0 text-center">
                    <div className={`truncate text-[0.58rem] font-bold uppercase tracking-[0.14em] ${isCompleted ? "text-stone-500" : "text-muted-foreground"}`}>
                      Flowed Back
                    </div>
                    <div className={`mt-1 truncate text-[0.95rem] font-semibold sm:mt-1.5 sm:text-lg ${isCompleted ? "text-stone-700" : "text-emerald-600"}`} title={formatCurrency(confirmedPayments)}>
                      {formatCurrency(confirmedPayments)}
                    </div>
                  </div>
                  <div className="min-w-0 text-right">
                    <div className={`truncate text-[0.58rem] font-bold uppercase tracking-[0.14em] ${isCompleted ? "text-stone-500" : "text-muted-foreground"}`}>
                      Remaining
                    </div>
                    <div className={`mt-1 truncate text-[0.95rem] font-semibold sm:mt-1.5 sm:text-lg ${isCompleted ? "text-stone-600" : ""}`} title={formatCurrency(outstanding)}>
                      {formatCurrency(outstanding)}
                    </div>
                  </div>
                </div>

                {loan.amount > 0 && (
                  <div className="mt-3 space-y-1 border-t border-border/40 pt-2">
                    <div className="flex items-center justify-between text-[0.62rem] text-muted-foreground">
                      <span>Settlement Progress</span>
                      <span className="font-semibold text-foreground">{percentRepaid}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200/70">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-stone-500" : percentRepaid > 0 ? "bg-emerald-500" : "bg-transparent"}`}
                        style={{ width: `${percentRepaid}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Pending Repayments / Review Actions */}
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
                          Waiting for {lenderName} to approve.
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

              {/* Action Buttons & History Link */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                <Link
                  href={`/loan/${loan.id}`}
                  className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition hover:underline"
                >
                  {isCompleted ? "View History →" : "Details & History →"}
                </Link>
                <div className="flex items-center gap-2">
                  {loan.status === "PENDING" && isBorrower && (
                    <AcknowledgeLoanButton loanId={loan.id} />
                  )}
                  {loan.status === "PENDING" && isLender && (
                    <span className="rounded-full border border-amber-500/20 bg-amber-50/70 px-2.5 py-1 text-[0.62rem] font-semibold text-amber-800">
                      Awaiting review
                    </span>
                  )}
                  {loan.status === "ACTIVE" && isBorrower && outstanding > 0 && (
                    <RepaymentDialog
                      loanId={loan.id}
                      outstanding={outstanding}
                      counterpartyName={loan.lender.name || loan.lender.email || "the other person"}
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
