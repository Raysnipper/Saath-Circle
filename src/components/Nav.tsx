"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Nav() {
  const { data: session, status } = useSession();

  return (
    <nav className="sticky top-0 z-30 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-[1.25rem] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1.1rem] border border-white/60 bg-white/70 shadow-sm sm:h-11 sm:w-11">
            <span className="font-brand text-xl font-semibold leading-none text-primary sm:text-2xl">
              S
            </span>
          </div>
          <div className="min-w-0">
            <div className="truncate font-brand text-[1.7rem] font-semibold tracking-tight text-foreground sm:text-3xl">
              Saath Circle
            </div>
            <div className="hidden text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground sm:block">
              Private Shared Balances
            </div>
          </div>
        </Link>

        <div className="shrink-0">
          {status === "loading" ? (
            <div className="h-10 w-28 animate-pulse rounded-full bg-muted" />
          ) : session ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden md:flex flex-col items-end rounded-2xl border border-white/60 bg-white/60 px-3 py-1.5 leading-tight shadow-sm">
                <span className="text-sm font-semibold text-foreground">
                  {session.user?.name || "Signed in"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {session.user?.email}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() =>
                signIn("google", undefined, { prompt: "select_account" })
              }
            >
              Sign In with Google
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
