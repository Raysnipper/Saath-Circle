"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/money";
import { formatShortDate } from "@/lib/loan-history";

export type PersonBondItem = {
  id: string;
  title: string | null;
  amount: number;
  outstanding: number;
  confirmedRepaid: number;
  status: string;
  createdAt: Date;
  isLender: boolean;
};

export type PersonGroup = {
  personKey: string;
  name: string;
  email: string | null;
  bonds: PersonBondItem[];
  totalExtended: number;
  totalReceived: number;
  totalRepaid: number;
  netBalance: number; // >0 means they owe current user, <0 means current user owes them
  activeCount: number;
  completedCount: number;
  pendingCount: number;
};

function personPalette(seed: string) {
  const palettes = [
    {
      avatar: "bg-amber-100 text-amber-900 border-amber-200",
      pill: "border-amber-200 bg-amber-50 text-amber-900",
      meta: "border-amber-100/80 bg-white/55",
    },
    {
      avatar: "bg-teal-100 text-teal-900 border-teal-200",
      pill: "border-teal-200 bg-teal-50 text-teal-900",
      meta: "border-teal-100/80 bg-white/55",
    },
    {
      avatar: "bg-sky-100 text-sky-900 border-sky-200",
      pill: "border-sky-200 bg-sky-50 text-sky-900",
      meta: "border-sky-100/80 bg-white/55",
    },
    {
      avatar: "bg-rose-100 text-rose-900 border-rose-200",
      pill: "border-rose-200 bg-rose-50 text-rose-900",
      meta: "border-rose-100/80 bg-white/55",
    },
  ];

  const hash = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
}

export function PersonCircleCard({ person }: { person: PersonGroup }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const palette = personPalette(person.name || person.email || "Person");

  const initials = person.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const isSettled = person.netBalance === 0 && person.activeCount === 0;

  return (
    <Card
      size="sm"
      className={`dashboard-card overflow-hidden transition-all hover:shadow-lg ${isSettled ? "!bg-surface/50 opacity-85" : ""}`}
    >
      {/* Clickable Header */}
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
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.2rem] border text-base font-bold sm:h-12 sm:w-12 sm:rounded-[1.3rem] ${isSettled ? "bg-stone-200 text-stone-700 border-stone-300" : palette.avatar}`}
          >
            {initials}
          </div>

          {/* Main Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className={`truncate text-base font-bold sm:text-lg ${isSettled ? "text-stone-700" : "text-foreground"}`}>
                  {person.name}
                </div>
                {person.email && (
                  <div className="truncate text-xs text-muted-foreground">
                    {person.email}
                  </div>
                )}
              </div>

              {/* Status indicator & Chevron */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge
                  variant="outline"
                  className={`rounded-[0.5rem] px-2 py-0.5 text-[0.55rem] font-bold tracking-[0.08em] shadow-none uppercase ${
                    person.netBalance > 0
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : person.netBalance < 0
                        ? "border-rose-200 bg-rose-50 text-rose-800"
                        : "border-stone-200 bg-stone-100 text-stone-700"
                  }`}
                >
                  {person.netBalance > 0
                    ? "Owes You"
                    : person.netBalance < 0
                      ? "You Owe"
                      : "Settled w/ Grace"}
                </Badge>

                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-transform duration-200 ${
                    isExpanded ? "rotate-180 bg-stone-100" : ""
                  }`}
                >
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Net Amount & Bond Count */}
            <div className="mt-2.5 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <div
                  className={`truncate text-[1.45rem] font-extrabold leading-none tracking-tight sm:text-[1.9rem] ${
                    person.netBalance > 0
                      ? "text-[#84A98C]"
                      : person.netBalance < 0
                        ? "text-[#E07A5F]"
                        : "text-stone-700"
                  }`}
                >
                  {formatCurrency(Math.abs(person.netBalance))}
                </div>
                <p className="mt-1 text-[0.68rem] text-muted-foreground">
                  {person.netBalance === 0
                    ? "zero open balance"
                    : person.netBalance > 0
                      ? "net in your favor"
                      : "net balance to return"}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1 text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground sm:text-xs">
                <span>{person.bonds.length}</span>
                <span>{person.bonds.length === 1 ? "Record" : "Records"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border/60"
          >
            <div className="space-y-3.5 p-3.5 sm:p-4 pt-2.5">
              {/* Financial Balance Strip */}
              <div
                className={`grid grid-cols-3 gap-2 rounded-[1.1rem] border p-3 sm:rounded-[1.35rem] sm:p-3.5 ${
                  isSettled ? "border-stone-200 bg-stone-100/50" : "border-white/60 bg-background/65"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                    Extended
                  </div>
                  <div className="mt-1 truncate text-[0.95rem] font-semibold sm:text-base text-foreground">
                    {formatCurrency(person.totalExtended)}
                  </div>
                </div>
                <div className="min-w-0 text-center">
                  <div className="flex items-center justify-center gap-1 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    <ArrowDownLeft className="h-3 w-3 text-rose-500" />
                    Received
                  </div>
                  <div className="mt-1 truncate text-[0.95rem] font-semibold sm:text-base text-foreground">
                    {formatCurrency(person.totalReceived)}
                  </div>
                </div>
                <div className="min-w-0 text-right">
                  <div className="flex items-center justify-end gap-1 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-stone-500" />
                    Flowed Back
                  </div>
                  <div className="mt-1 truncate text-[0.95rem] font-semibold sm:text-base text-emerald-600">
                    {formatCurrency(person.totalRepaid)}
                  </div>
                </div>
              </div>

              {/* Shared Bonds List */}
              <div className="space-y-2">
                <div className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted-foreground px-1">
                  Shared Records with {person.name}
                </div>
                <div className="space-y-1.5">
                  {person.bonds.map((bond) => (
                    <Link
                      key={bond.id}
                      href={`/loan/${bond.id}`}
                      className="group flex items-center justify-between gap-2.5 rounded-xl border border-outline-variant/25 bg-white/70 p-2.5 transition-colors hover:border-primary/30 hover:bg-white sm:p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors sm:text-sm">
                            {bond.title || "Shared Record"}
                          </span>
                          <span className="text-[0.55rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-border/60 bg-stone-50 text-muted-foreground">
                            {bond.isLender ? "Extended" : "Received"}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[0.62rem] text-muted-foreground">
                          {formatShortDate(new Date(bond.createdAt))}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-foreground sm:text-sm">
                          {formatCurrency(bond.outstanding)}
                        </div>
                        <div className="text-[0.55rem] uppercase tracking-wider font-semibold text-muted-foreground">
                          {bond.status === "COMPLETED"
                            ? "Settled"
                            : bond.status === "PENDING"
                              ? "Awaiting"
                              : "Open"}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
