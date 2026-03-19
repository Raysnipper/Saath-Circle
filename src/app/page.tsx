import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLastActivity } from "@/lib/loan-history";
import { LoanCard } from "@/components/LoanCard";
import { LoanForm } from "@/components/LoanForm";
import { Nav } from "@/components/Nav";

type LoanWithRelations = Prisma.LoanGetPayload<{
  include: {
    borrower: true;
    lender: true;
    transactions: true;
  };
}>;

function loanPriority(loan: LoanWithRelations) {
  const hasPendingReview = loan.transactions.some(
    (transaction) => transaction.status === "PENDING"
  );

  if (loan.status === "PENDING") return 0;
  if (loan.status === "ACTIVE" && hasPendingReview) return 1;
  if (loan.status === "ACTIVE") return 2;
  if (loan.status === "COMPLETED") return 3;
  return 4;
}

function matchesFilter(
  loan: LoanWithRelations,
  filter: "all" | "needs-action" | "active" | "completed"
) {
  if (filter === "all") return true;
  if (filter === "completed") return loan.status === "COMPLETED";
  if (filter === "active") return loan.status === "ACTIVE";
  if (filter === "needs-action") {
    return (
      loan.status === "PENDING" ||
      loan.transactions.some((transaction) => transaction.status === "PENDING")
    );
  }
  return true;
}

function searchValue(value?: string | null) {
  return value?.trim().toLowerCase() || "";
}

function matchesSearch(loan: LoanWithRelations, query: string) {
  const normalizedQuery = searchValue(query);

  if (!normalizedQuery) return true;

  const haystack = [
    loan.title,
    loan.borrower.name,
    loan.borrower.email,
    loan.lender.name,
    loan.lender.email,
  ]
    .map((value) => searchValue(value))
    .filter(Boolean)
    .join(" ");

  return haystack.includes(normalizedQuery);
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string; q?: string }>;
}) {
  const params = (await searchParams) || {};
  const filter =
    params.filter === "needs-action" ||
    params.filter === "active" ||
    params.filter === "completed"
      ? params.filter
      : "all";
  const query = typeof params.q === "string" ? params.q.trim() : "";

  const session = await getServerSession(authOptions);

  let userLoans: LoanWithRelations[] = [];
  let owedToYou = 0;
  let youOwe = 0;

  if (session?.user?.id) {
    userLoans = await prisma.loan.findMany({
      where: {
        OR: [{ lenderId: session.user.id }, { borrowerId: session.user.id }],
      },
      include: {
        borrower: true,
        lender: true,
        transactions: true,
      },
      orderBy: { createdAt: "desc" },
    });

    userLoans = [...userLoans].sort((a, b) => {
      const priorityDiff = loanPriority(a) - loanPriority(b);
      if (priorityDiff !== 0) return priorityDiff;
      return (
        getLastActivity(b).date.getTime() - getLastActivity(a).date.getTime()
      );
    });

    userLoans.forEach((loan) => {
      if (loan.status !== "ACTIVE") return;

      const confirmedRepaid = loan.transactions
        .filter((transaction) => transaction.status === "CONFIRMED")
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      const outstanding = loan.amount - confirmedRepaid;

      if (outstanding > 0) {
        if (loan.lenderId === session.user.id) {
          owedToYou += outstanding;
        } else if (loan.borrowerId === session.user.id) {
          youOwe += outstanding;
        }
      }
    });
  }

  const visibleLoans = userLoans.filter(
    (loan) => matchesFilter(loan, filter) && matchesSearch(loan, query)
  );
  const netBalance = owedToYou - youOwe;

  const filters = [
    { key: "all", label: "All" },
    { key: "needs-action", label: "Needs Action" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
  ] as const;
  const filterCounts = {
    all: userLoans.length,
    "needs-action": userLoans.filter((loan) =>
      matchesFilter(loan, "needs-action")
    ).length,
    active: userLoans.filter((loan) => matchesFilter(loan, "active")).length,
    completed: userLoans.filter((loan) => matchesFilter(loan, "completed"))
      .length,
  } satisfies Record<(typeof filters)[number]["key"], number>;

  return (
    <div className="min-h-screen flex flex-col text-foreground">
      <Nav />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        {!session ? (
          <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
            <div className="max-w-4xl space-y-8 rounded-[2rem] border border-white/60 bg-white/65 px-8 py-14 shadow-[0_24px_70px_rgba(93,72,52,0.1)] backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                Saath Circle
              </p>
              <h1 className="font-brand text-6xl font-semibold leading-none text-foreground sm:text-8xl">
                Shared balances,
                <br />
                held with care.
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                A private place to keep shared balances clear and comfortable,
                without turning personal money into awkward conversation.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-7">
            <header className="grid gap-3 rounded-[1.5rem] border border-white/70 bg-white/60 p-4 shadow-[0_14px_32px_rgba(93,72,52,0.08)] backdrop-blur-sm sm:p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="space-y-2.5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Saath Circle
                </p>
                <div className="space-y-1.5">
                  <h1 className="font-brand text-[2.8rem] font-semibold leading-none text-foreground sm:text-5xl lg:text-[3.5rem]">
                    Money Between People
                  </h1>
                  <p className="max-w-xl text-sm leading-5 text-muted-foreground sm:text-base sm:leading-6">
                    Stay clear on who owes what, without awkward reminders.
                  </p>
                </div>
              </div>
              <div className="flex justify-start md:justify-end">
                <LoanForm />
              </div>
            </header>

            <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 sm:gap-3">
              <div className="col-span-2 rounded-[1.35rem] border border-white/70 bg-white/70 p-3.5 shadow-[0_12px_32px_rgba(93,72,52,0.07)] backdrop-blur-sm sm:col-span-1 sm:rounded-[1.5rem] sm:p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Net Balance
                </p>
                <div
                  className={`mt-2.5 font-sans text-[1.85rem] font-bold leading-none tracking-tight tabular-nums sm:mt-3 sm:text-[2.3rem] ${netBalance > 0 ? "text-emerald-600" : netBalance < 0 ? "text-rose-500" : "text-foreground"}`}
                >
                  {"\u20B9"}
                  {netBalance.toFixed(2)}
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-white/70 bg-white/70 p-3.5 shadow-[0_12px_32px_rgba(93,72,52,0.07)] backdrop-blur-sm sm:rounded-[1.5rem] sm:p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Owed To You
                </p>
                <div className="mt-2.5 font-sans text-[1.75rem] font-bold leading-none tracking-tight tabular-nums text-emerald-600 sm:mt-3 sm:text-[2.3rem]">
                  {"\u20B9"}
                  {owedToYou.toFixed(2)}
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-white/70 bg-white/70 p-3.5 shadow-[0_12px_32px_rgba(93,72,52,0.07)] backdrop-blur-sm sm:rounded-[1.5rem] sm:p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  You Owe
                </p>
                <div className="mt-2.5 font-sans text-[1.75rem] font-bold leading-none tracking-tight tabular-nums text-rose-500 sm:mt-3 sm:text-[2.3rem]">
                  {"\u20B9"}
                  {youOwe.toFixed(2)}
                </div>
              </div>
            </div>

            <section className="space-y-3 sm:space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="font-brand text-[2.4rem] font-semibold leading-none sm:text-[2.25rem]">
                    Your Records
                  </h2>
                </div>
                <div className="flex flex-col gap-1.5 lg:w-[41rem] lg:items-end">
                  <div className="flex justify-start lg:w-full lg:justify-end">
                    <form
                      action="/"
                      method="get"
                      className="flex w-full flex-wrap gap-2 sm:flex-nowrap lg:w-full lg:justify-end"
                    >
                      {filter !== "all" && (
                        <input type="hidden" name="filter" value={filter} />
                      )}
                      <label className="sr-only" htmlFor="dashboard-search">
                        Search records
                      </label>
                      <input
                        id="dashboard-search"
                        name="q"
                        type="search"
                        defaultValue={query}
                        placeholder="Search by person or title"
                        className="h-9 min-w-0 basis-full rounded-full border border-border bg-white/70 px-4 text-[0.74rem] text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 sm:h-10 sm:min-w-[18rem] sm:basis-auto sm:flex-1 sm:text-[0.8rem] lg:max-w-[26rem]"
                      />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary-foreground transition hover:bg-primary/95 sm:h-10 sm:text-[0.72rem]"
                      >
                        Search
                      </button>
                      {query && (
                        <Link
                          href={filter === "all" ? "/" : `/?filter=${filter}`}
                          className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-white/70 px-4 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition hover:bg-white hover:text-foreground sm:h-10 sm:text-[0.72rem]"
                        >
                          Clear
                        </Link>
                      )}
                    </form>
                  </div>
                  <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 lg:w-full lg:justify-end">
                    {filters.map((item) => {
                      const active = filter === item.key;
                      const href =
                        item.key === "all"
                          ? query
                            ? `/?q=${encodeURIComponent(query)}`
                            : "/"
                          : `/?filter=${item.key}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
                      return (
                        <Link
                          key={item.key}
                          href={href}
                          className={`shrink-0 rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] transition sm:px-4 sm:py-2 ${active ? "border-primary/30 bg-primary text-primary-foreground" : "border-border bg-white/70 text-muted-foreground hover:bg-white"}`}
                        >
                          {item.label} ({filterCounts[item.key]})
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              {visibleLoans.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-border/80 bg-white/50 px-6 py-12 text-center text-card-foreground shadow-[0_14px_36px_rgba(93,72,52,0.05)]">
                  <h3 className="font-brand text-3xl font-semibold text-foreground">
                    {query ? "No matching records" : "Nothing here yet"}
                  </h3>
                  <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
                    {query
                      ? "Try a different person name or record title, or clear the search to see everything again."
                      : filter === "completed"
                        ? "Completed records will collect here so settled balances stay easy to revisit."
                        : "Add your first shared record to keep balances clear from the very beginning."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleLoans.map((loan) => (
                    <LoanCard
                      key={loan.id}
                      loan={loan}
                      currentUserId={session.user.id}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
