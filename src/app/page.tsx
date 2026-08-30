import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLastActivity } from "@/lib/loan-history";
import { formatCurrency, moneyToNumber } from "@/lib/money";
import { LoanCard } from "@/components/LoanCard";
import { PersonCircleCard, PersonGroup } from "@/components/PersonCircleCard";
import { DashboardViewSwitcher } from "@/components/DashboardViewSwitcher";
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
    loan.borrower?.name,
    loan.borrower?.email,
    loan.borrowerEmail,
    loan.lender.name,
    loan.lender.email,
  ]
    .map((value) => searchValue(value))
    .filter(Boolean)
    .join(" ");

  return haystack.includes(normalizedQuery);
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

function groupLoansByPerson(loans: LoanWithRelations[], currentUserId: string): PersonGroup[] {
  const map = new Map<string, PersonGroup>();

  for (const loan of loans) {
    const isLender = loan.lenderId === currentUserId;
    const counterpartUser = isLender ? loan.borrower : loan.lender;
    const counterpartEmail = isLender
      ? loan.borrowerEmail || loan.borrower?.email || null
      : loan.lender.email || null;
    const counterpartName = isLender
      ? toDisplayName(loan.borrower?.name, counterpartEmail)
      : toDisplayName(loan.lender.name, loan.lender.email);

    const personKey = counterpartUser?.id || counterpartEmail || counterpartName;

    let group = map.get(personKey);
    if (!group) {
      group = {
        personKey,
        name: counterpartName,
        email: counterpartEmail,
        bonds: [],
        totalExtended: 0,
        totalReceived: 0,
        totalRepaid: 0,
        netBalance: 0,
        activeCount: 0,
        completedCount: 0,
        pendingCount: 0,
      };
      map.set(personKey, group);
    }

    const confirmedRepaid = loan.transactions
      .filter((t) => t.status === "CONFIRMED")
      .reduce((sum, t) => sum + moneyToNumber(t.amount), 0);
    const loanAmount = moneyToNumber(loan.amount);
    const outstanding = Math.max(0, loanAmount - confirmedRepaid);

    group.bonds.push({
      id: loan.id,
      title: loan.title,
      amount: loanAmount,
      outstanding,
      confirmedRepaid,
      status: loan.status,
      createdAt: loan.createdAt,
      isLender,
    });

    if (isLender) {
      group.totalExtended += loanAmount;
    } else {
      group.totalReceived += loanAmount;
    }
    group.totalRepaid += confirmedRepaid;

    if (loan.status === "ACTIVE") {
      group.activeCount++;
      if (isLender) {
        group.netBalance += outstanding;
      } else {
        group.netBalance -= outstanding;
      }
    } else if (loan.status === "COMPLETED") {
      group.completedCount++;
    } else if (loan.status === "PENDING") {
      group.pendingCount++;
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.activeCount > 0 && b.activeCount === 0) return -1;
    if (b.activeCount > 0 && a.activeCount === 0) return 1;
    const aLatest = a.bonds[0]?.createdAt.getTime() || 0;
    const bLatest = b.bonds[0]?.createdAt.getTime() || 0;
    return bLatest - aLatest;
  });
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string; q?: string; view?: string }>;
}) {
  const params = (await searchParams) || {};
  const filter =
    params.filter === "needs-action" ||
    params.filter === "active" ||
    params.filter === "completed"
      ? params.filter
      : "all";
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const isPeopleView = params.view === "people";

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
        .reduce((sum, transaction) => sum + moneyToNumber(transaction.amount), 0);

      const outstanding = moneyToNumber(loan.amount) - confirmedRepaid;

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

  const peopleGroups = session?.user?.id
    ? groupLoansByPerson(userLoans, session.user.id)
    : [];

  const visiblePeople = peopleGroups.filter((person) => {
    if (query) {
      const q = query.toLowerCase();
      const match =
        person.name.toLowerCase().includes(q) ||
        (person.email && person.email.toLowerCase().includes(q)) ||
        person.bonds.some((b) => b.title && b.title.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (filter === "needs-action") {
      return person.pendingCount > 0 || person.bonds.some((b) => b.status === "PENDING");
    }
    if (filter === "active") {
      return person.activeCount > 0;
    }
    if (filter === "completed") {
      return person.completedCount > 0 && person.activeCount === 0;
    }
    return true;
  });

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

  const viewQuerySuffix = isPeopleView ? "&view=people" : "";

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

              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <LoanForm />
              </div>
            </header>

            <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 sm:gap-4">
              <div className="dashboard-card col-span-2 min-w-0 p-5 sm:col-span-1 sm:p-7 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-on-surface/40 mb-2 sm:mb-4">
                  The Mutual Standing
                </p>
                <div className={`font-sans text-2xl sm:text-3xl lg:text-4xl font-bold leading-none tracking-tight tabular-nums truncate max-w-full ${netBalance > 0 ? "text-[#84A98C]" : netBalance < 0 ? "text-[#E07A5F]" : "text-primary"}`}>
                  {formatCurrency(netBalance)}
                </div>
              </div>
              <div className="dashboard-card min-w-0 p-4 sm:p-7 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface/40 mb-2 sm:mb-4 truncate max-w-full">
                  Support Sent
                </p>
                <div className="font-sans text-xl sm:text-2xl lg:text-3xl font-bold leading-none tracking-tight tabular-nums text-[#84A98C] truncate max-w-full">
                  {formatCurrency(owedToYou)}
                </div>
              </div>
              <div className="dashboard-card min-w-0 p-4 sm:p-7 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface/40 mb-2 sm:mb-4 truncate max-w-full">
                  Support Received
                </p>
                <div className="font-sans text-xl sm:text-2xl lg:text-3xl font-bold leading-none tracking-tight tabular-nums text-[#E07A5F] truncate max-w-full">
                  {formatCurrency(youOwe)}
                </div>
              </div>
            </div>

            <section className="space-y-4 sm:space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[2rem] font-extrabold tracking-tighter text-primary sm:text-4xl shrink-0">
                    {isPeopleView ? "Your Circle" : "Your Active Bonds"}
                  </h2>
                  <DashboardViewSwitcher
                    recordCount={visibleLoans.length}
                    peopleCount={peopleGroups.length}
                  />
                </div>

                <div className="flex flex-col gap-3 w-full lg:w-max lg:max-w-[calc(100vw-3rem)] lg:ml-auto">
                  <form
                    action="/"
                    method="get"
                    className="flex w-full items-center gap-2 flex-nowrap"
                  >
                      {filter !== "all" && (
                        <input type="hidden" name="filter" value={filter} />
                      )}
                      {isPeopleView && (
                        <input type="hidden" name="view" value="people" />
                      )}
                      <label className="sr-only" htmlFor="dashboard-search">
                        Search records
                      </label>
                      <input
                        id="dashboard-search"
                        name="q"
                        type="search"
                        defaultValue={query}
                        placeholder={isPeopleView ? "Find a person in your circle..." : "Find a person or a promise..."}
                        className="h-9 min-w-0 flex-1 rounded-full border border-outline-variant/30 bg-white/70 px-4 text-[0.74rem] text-primary outline-none transition placeholder:text-on-surface/40 focus:border-primary/30 focus:ring-2 focus:ring-primary/20 sm:h-10 sm:min-w-[18rem] sm:text-[0.8rem]"
                      />
                      <button
                        type="submit"
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-[0.68rem] font-bold uppercase tracking-widest text-on-primary transition hover:opacity-90 sm:h-10 sm:px-5 sm:text-[0.72rem]"
                      >
                        Search
                      </button>
                      {query && (
                        <Link
                          href={
                            filter === "all"
                              ? isPeopleView ? "/?view=people" : "/"
                              : `/?filter=${filter}${viewQuerySuffix}`
                          }
                          className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-outline-variant/30 bg-white/70 px-3.5 text-[0.68rem] font-bold uppercase tracking-widest text-on-surface/60 transition hover:bg-white hover:text-primary sm:h-10 sm:px-5 sm:text-[0.72rem]"
                        >
                          Clear
                        </Link>
                      )}
                    </form>
                    <div className="w-full">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none whitespace-nowrap lg:w-max lg:ml-auto">
                      {filters.map((item) => {
                      const active = filter === item.key;
                      const href =
                        item.key === "all"
                          ? query
                            ? `/?q=${encodeURIComponent(query)}${viewQuerySuffix}`
                            : isPeopleView ? "/?view=people" : "/"
                          : `/?filter=${item.key}${query ? `&q=${encodeURIComponent(query)}` : ""}${viewQuerySuffix}`;
                      return (
                        <Link
                          key={item.key}
                          href={href}
                          className={`shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition sm:px-4 sm:py-1.5 ${active ? "border-primary bg-primary text-on-primary" : "border-outline-variant/30 bg-white/60 text-on-surface/50 hover:bg-white"}`}
                        >
                          {item.label} ({filterCounts[item.key]})
                        </Link>
                      );
                    })}
                      </div>
                    </div>
                  </div>
                </div>

              {isPeopleView ? (
                visiblePeople.length === 0 ? (
                  <div className="dashboard-card border border-dashed border-primary/20 bg-white/20 px-6 py-16 text-center">
                    <h3 className="text-3xl font-extrabold tracking-tighter text-primary">
                      {query ? "No matching contacts" : "No circle contacts yet"}
                    </h3>
                    <p className="mx-auto mt-3 max-w-sm text-sm text-on-surface/60 font-medium">
                      {query
                        ? "Try searching with a different name or email."
                        : "Start your first handshake to begin building your trusted circle."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {visiblePeople.map((person) => (
                      <PersonCircleCard key={person.personKey} person={person} />
                    ))}
                  </div>
                )
              ) : (
                visibleLoans.length === 0 ? (
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
                        loan={{
                          ...loan,
                          amount: moneyToNumber(loan.amount),
                          transactions: loan.transactions.map((transaction) => ({
                            ...transaction,
                            amount: moneyToNumber(transaction.amount),
                          })),
                        }}
                        currentUserId={session.user.id}
                      />
                    ))}
                  </div>
                )
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
