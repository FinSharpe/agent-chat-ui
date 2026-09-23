"use client";

import React from "react";
import { AllocationItem, DetailRow } from "../../types/discover.types";

/* Cardless building blocks shared by the Discover detail screens: a small
   uppercase label, label/value rows split by hairlines, and allocation bars. */

export function DetailLabel({
  children,
  flush = false,
}: {
  children: React.ReactNode;
  /** No side inset — for labels over full-width prose. */
  flush?: boolean;
}) {
  return (
    <h4
      className={`${flush ? "" : "px-0.5"} text-[10px] font-medium tracking-wider text-slate-400 uppercase`}
    >
      {children}
    </h4>
  );
}

export function KeyValueRows({ rows }: { rows: DetailRow[] }) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex items-center justify-between py-2.5"
        >
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {r.label}
          </span>
          <span className="text-[11px] font-medium text-[#0A1F4D] tabular-nums dark:text-white">
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/** One bar per item. `signed` shows the short side of a long-short book in rose. */
export function AllocBars({
  data,
  signed = false,
}: {
  data: AllocationItem[];
  signed?: boolean;
}) {
  const digits = data.some((a) => !Number.isInteger(a.pct)) ? 1 : 0;
  return (
    <div className="space-y-1.5">
      {data.map((a) => {
        const negative = a.pct < 0;
        return (
          <div
            key={a.name}
            className="space-y-0.5"
          >
            <div className="flex justify-between gap-3 text-[10px]">
              <span className="truncate font-medium text-[#0A1F4D] dark:text-white">
                {a.name}
              </span>
              <span
                className={`tabular-nums ${negative ? "text-rose-500" : "text-slate-400"}`}
              >
                {signed && a.pct > 0 ? "+" : ""}
                {a.pct.toFixed(digits)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${negative ? "bg-rose-500" : "bg-[#063BAA]"}`}
                style={{ width: `${Math.min(Math.abs(a.pct), 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
