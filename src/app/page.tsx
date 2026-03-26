import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLastActivity } from "@/lib/loan-history";
import { LoanCard } from "@/components/LoanCard";
import { LoanForm } from "@/components/LoanForm";
import { Nav } from "@/components/Nav";
import { LandingHero } from "@/components/LandingHero";

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
    { key: "all", label: "All Bonds" },
    { key: "needs-action", label: "Pending Handshake" },
    { key: "active", label: "Ongoing Support" },
    { key: "completed", label: "Settled Stories" },
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
    <div className={`min-h-screen flex flex-col ${session ? 'text-foreground' : ''}`}>
      {session && <Nav />}
      <main className={!session ? "flex-1" : "mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8"}>
        {!session ? (
          <LandingHero />
        ) : (
          <div className="space-y-5 sm:space-y-7">
            <header className="dashboard-card grid gap-3 p-4 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="space-y-2">
                <h1 className="text-[2.8rem] tracking-tighter font-extrabold leading-none text-primary sm:text-5xl lg:text-[3.5rem]">
                  Our Shared Bonds
                </h1>
                <p className="max-w-xl text-sm font-medium leading-5 text-on-surface/60 sm:text-base sm:leading-6">
                  A private, trusted record of helping hands between you and your circle.
                </p>
              </div>
              <div className="flex justify-start md:justify-end">
                <LoanForm />
              </div>
            </header>

            <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 sm:gap-4">
              <div className="dashboard-card col-span-2 p-6 sm:col-span-1 sm:p-8 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-on-surface/40 mb-4 sm:mb-5">
                  The Mutual Standing
                </p>
                <div className={`font-sans text-[2.2rem] sm:text-[2.8rem] font-bold leading-none tracking-tight tabular-nums ${netBalance > 0 ? "text-[#84A98C]" : netBalance < 0 ? "text-[#E07A5F]" : "text-primary"}`}>
                  {"\u20B9"}{Math.abs(netBalance).toFixed(2)}
                </div>
              </div>
              <div className="dashboard-card p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface/40 mb-4 sm:mb-5">
                  Support Extended
                </p>
                <div className="font-sans text-[2.2rem] sm:text-[2.8rem] font-bold leading-none tracking-tight tabular-nums text-[#84A98C]">
                  {"\u20B9"}{owedToYou.toFixed(2)}
                </div>
              </div>
              <div className="dashboard-card p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface/40 mb-4 sm:mb-5">
                  Support Received
                </p>
                <div className="font-sans text-[2.2rem] sm:text-[2.8rem] font-bold leading-none tracking-tight tabular-nums text-[#E07A5F]">
                  {"\u20B9"}{youOwe.toFixed(2)}
                </div>
              </div>
            </div>

            <section className="space-y-4 sm:space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <h2 className="text-[2rem] font-extrabold tracking-tighter text-primary sm:text-4xl">
                  Your Active Bonds
                </h2>
                <div className="flex flex-col gap-3 w-full lg:max-w-[42rem] lg:items-end">
                  <form
                    action="/"
                    method="get"
                    className="flex w-full flex-wrap gap-2 sm:flex-nowrap"
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
                        placeholder="Find a person or a promise..."
                        className="h-9 min-w-0 basis-full flex-1 rounded-full border border-outline-variant/30 bg-white/70 px-4 text-[0.74rem] text-primary outline-none transition placeholder:text-on-surface/40 focus:border-primary/30 focus:ring-2 focus:ring-primary/20 sm:h-10 sm:min-w-[18rem] sm:basis-auto sm:text-[0.8rem]"
                      />
                      <button
                        type="submit"
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-primary px-5 text-[0.68rem] font-bold uppercase tracking-widest text-on-primary transition hover:opacity-90 sm:h-10 sm:text-[0.72rem]"
                      >
                        Search
                      </button>
                      {query && (
                        <Link
                          href={filter === "all" ? "/" : `/?filter=${filter}`}
                          className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-outline-variant/30 bg-white/70 px-5 text-[0.68rem] font-bold uppercase tracking-widest text-on-surface/60 transition hover:bg-white hover:text-primary sm:h-10 sm:text-[0.72rem]"
                        >
                          Clear
                        </Link>
                      )}
                    </form>
                    <div className="w-full">
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none whitespace-nowrap lg:justify-end">
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
                          className={`shrink-0 rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition sm:px-5 sm:py-2 ${active ? "border-primary bg-primary text-on-primary" : "border-outline-variant/30 bg-white/60 text-on-surface/50 hover:bg-white"}`}
                        >
                          {item.label} ({filterCounts[item.key]})
                        </Link>
                      );
                    })}
                      </div>
                    </div>
                  </div>
                </div>

              {visibleLoans.length === 0 ? (
                <div className="dashboard-card border border-dashed border-primary/20 bg-white/20 px-6 py-16 text-center">
                  <h3 className="text-3xl font-extrabold tracking-tighter text-primary">
                    {query ? "No matching records" : "Nothing here yet"}
                  </h3>
                  <p className="mx-auto mt-3 max-w-sm text-sm text-on-surface/60 font-medium">
                    {query
                      ? "Try a different person name or record title, or clear the search."
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
