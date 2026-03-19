type LoanHistoryTransaction = {
  createdAt: Date;
  status: string;
  reviewedAt?: Date | null;
};

type LoanHistoryRecord = {
  createdAt: Date;
  acknowledgedAt?: Date | null;
  completedAt?: Date | null;
  transactions: LoanHistoryTransaction[];
};

type LastActivity = {
  label: string;
  date: Date;
};

export function getLastActivity(loan: LoanHistoryRecord): LastActivity {
  if (loan.completedAt) {
    return {
      label: "Settled",
      date: new Date(loan.completedAt),
    };
  }

  const reviewedTransactions = loan.transactions
    .filter((transaction) => transaction.reviewedAt)
    .sort(
      (a, b) =>
        new Date(b.reviewedAt as Date).getTime() -
        new Date(a.reviewedAt as Date).getTime()
    );

  if (reviewedTransactions.length > 0) {
    const latest = reviewedTransactions[0];
    return {
      label:
        latest.status === "CONFIRMED"
          ? "Repayment confirmed"
          : "Repayment rejected",
      date: new Date(latest.reviewedAt as Date),
    };
  }

  const pendingTransactions = loan.transactions
    .filter((transaction) => transaction.status === "PENDING")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  if (pendingTransactions.length > 0) {
    return {
      label: "Repayment submitted",
      date: new Date(pendingTransactions[0].createdAt),
    };
  }

  if (loan.acknowledgedAt) {
    return {
      label: "Acknowledged",
      date: new Date(loan.acknowledgedAt),
    };
  }

  return {
    label: "Created",
    date: new Date(loan.createdAt),
  };
}

export function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
