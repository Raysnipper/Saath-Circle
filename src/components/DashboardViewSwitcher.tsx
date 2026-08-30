"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutList, Users } from "lucide-react";

function SwitcherInner({
  recordCount,
  peopleCount,
}: {
  recordCount: number;
  peopleCount: number;
}) {
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") === "people" ? "people" : "records";

  function createViewUrl(view: "records" | "people") {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "people") {
      params.set("view", "people");
    } else {
      params.delete("view");
    }
    const query = params.toString();
    return query ? `/?${query}` : "/";
  }

  return (
    <div className="inline-flex items-center rounded-full border border-outline-variant/30 bg-white/70 p-1 shadow-sm">
      <Link
        href={createViewUrl("records")}
        className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider transition sm:px-4 sm:py-1.5 sm:text-[0.72rem] ${
          currentView === "records"
            ? "bg-primary text-on-primary shadow-sm"
            : "text-on-surface/60 hover:text-primary"
        }`}
      >
        <LayoutList className="h-3.5 w-3.5" />
        <span>Records</span>
        <span
          className={`rounded-full px-1.5 py-0.2 text-[0.6rem] ${
            currentView === "records"
              ? "bg-white/20 text-white"
              : "bg-black/5 text-muted-foreground"
          }`}
        >
          {recordCount}
        </span>
      </Link>

      <Link
        href={createViewUrl("people")}
        className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider transition sm:px-4 sm:py-1.5 sm:text-[0.72rem] ${
          currentView === "people"
            ? "bg-primary text-on-primary shadow-sm"
            : "text-on-surface/60 hover:text-primary"
        }`}
      >
        <Users className="h-3.5 w-3.5" />
        <span>By Circle</span>
        <span
          className={`rounded-full px-1.5 py-0.2 text-[0.6rem] ${
            currentView === "people"
              ? "bg-white/20 text-white"
              : "bg-black/5 text-muted-foreground"
          }`}
        >
          {peopleCount}
        </span>
      </Link>
    </div>
  );
}

export function DashboardViewSwitcher(props: {
  recordCount: number;
  peopleCount: number;
}) {
  return (
    <Suspense
      fallback={
        <div className="inline-flex h-8 w-44 animate-pulse rounded-full bg-stone-200/50" />
      }
    >
      <SwitcherInner {...props} />
    </Suspense>
  );
}
