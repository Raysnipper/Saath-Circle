"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Nav() {
  const { data: session, status } = useSession();

  return (
    <nav className="sticky top-0 w-full z-50 bg-surface/40 backdrop-blur-xl border-b border-outline-variant/20">
      <div className="flex justify-between items-center px-6 lg:px-12 py-4 max-w-[1600px] mx-auto">
        <Link
          href="/"
          className="flex min-w-0 items-center hover:opacity-90 transition-opacity"
        >
          <div className="text-xl font-extrabold tracking-tighter text-primary">SAATH CIRCLE</div>
        </Link>

        <div className="shrink-0">
          {status === "loading" ? (
            <div className="h-10 w-28 animate-pulse rounded-full bg-white/40" />
          ) : session ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end px-3 py-1.5 leading-tight">
                <span className="text-sm font-bold text-primary">
                  {session.user?.name || "Signed in"}
                </span>
                <span className="text-xs text-on-surface/50 font-medium">
                  {session.user?.email}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="bg-white text-primary px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 hover:bg-surface-container hover:shadow-md transition-all"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google", undefined, { prompt: "select_account" })}
              className="bg-primary text-on-primary px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary-container transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
