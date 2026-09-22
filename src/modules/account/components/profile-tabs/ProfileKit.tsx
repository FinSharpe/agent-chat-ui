"use client";

import React from "react";
import dynamic from "next/dynamic";

// Loaded on demand — see ProfileCharts.tsx.
export const UsageAreaChart = dynamic(
  () => import("./ProfileCharts").then((m) => m.UsageAreaChart),
  { ssr: false },
);
export const UsageBarChart = dynamic(
  () => import("./ProfileCharts").then((m) => m.UsageBarChart),
  { ssr: false },
);

export function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="glass-card rounded-nested flex-1 space-y-1 p-4.5">
      <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
        {label}
      </p>
      <p
        className={`stat-hero text-xl ${accent ? "text-[#063BAA]" : "text-[#0A1F4D]"}`}
      >
        {value}
      </p>
    </div>
  );
}

/** Small uppercase label heading a card. */
export function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="px-1 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
      {children}
    </h4>
  );
}

/** Thin rounded meter; `brand` fills with the gradient, else solid blue. */
export function Meter({
  percent,
  brand = true,
  thin = false,
}: {
  percent: number;
  brand?: boolean;
  thin?: boolean;
}) {
  return (
    <div
      className={`w-full ${thin ? "h-1.5" : "h-2"} overflow-hidden rounded-full bg-slate-100`}
    >
      <div
        className={`h-full rounded-full ${brand ? "bg-brand-gradient" : "bg-[#063BAA]"}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
