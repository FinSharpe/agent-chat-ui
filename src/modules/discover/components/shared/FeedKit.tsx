"use client";

import React from "react";
import { SectionLabel } from "@/components/shared/SectionKit";

/* The small parts the two live Discover feeds (market news, IPO Watch) are
   built from — the same pieces finsharpe-mobile draws them with, in this
   app's design language. They live here so a chip, a caveat or a section head
   cannot drift between the two screens. */

export type ChipTone = "positive" | "negative" | "neutral" | "info" | "warning";

const CHIP_TONES: Record<ChipTone, string> = {
  positive: "tone-mint",
  negative: "bg-rose-500/12 text-rose-500",
  neutral: "bg-slate-100 text-slate-500",
  info: "tone-blue",
  warning: "bg-amber-500/14 text-amber-600",
};

/**
 * A status pill: a sentiment, a window state, a warning about what a figure
 * is. Never used for a caveat — a badge would give a qualifier the weight of
 * a verdict.
 */
export function StatusChip({
  label,
  tone = "neutral",
  dot = false,
}: {
  label: string;
  tone?: ChipTone;
  /** A leading dot, for the one state that is happening right now. */
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-medium tracking-wider uppercase ${CHIP_TONES[tone]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
}

/** A plain count beside a section head. */
export function CountChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 tabular-nums">
      {label}
    </span>
  );
}

/**
 * A section heading with an optional count, over a group of cards — the app's
 * `SectionLabel` treatment (which is what finsharpe-mobile's `SectionHead`
 * upcases to), plus the count pill.
 */
export function SectionHead({
  title,
  chip,
}: {
  title: string;
  chip?: string | null;
}) {
  return (
    <div className="mb-2 flex items-center gap-2 pl-1">
      <SectionLabel>{title}</SectionLabel>
      {chip && <CountChip label={chip} />}
    </div>
  );
}

/**
 * A quiet qualifier under the figures it applies to — what a number is made
 * of, or why one is missing.
 */
export function Caveat({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="mt-px shrink-0 text-slate-400">{icon}</span>
      <p className="text-[10px] leading-relaxed text-slate-400">{children}</p>
    </div>
  );
}

/** One label-and-value line inside a card. */
export function Fact({
  label,
  value,
  sub,
  strong = false,
}: {
  label: string;
  value: string;
  /** A quieter second line under the value — what the figure is made of. */
  sub?: string | null;
  /** The card's headline figure, given the weight the others do not get. */
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="min-w-0 text-right">
        <span
          className={`block tabular-nums ${strong ? "font-geist text-[13px] font-medium text-[#0A1F4D]" : "text-[11px] text-[#0A1F4D]"}`}
        >
          {value}
        </span>
        {sub && <span className="block text-[10px] text-slate-400">{sub}</span>}
      </span>
    </div>
  );
}

/** The hairline that splits a card into its parts. */
export const CardDivider = () => (
  <div className="my-3 h-px w-full bg-slate-100" />
);

/** A shimmering placeholder block, for a card that is still loading. */
export function SkeletonBlock({
  width,
  height = 10,
}: {
  width?: number | string;
  height?: number;
}) {
  return (
    <div
      className="animate-pulse rounded-full bg-slate-100"
      style={{ width: width ?? "100%", height }}
    />
  );
}
