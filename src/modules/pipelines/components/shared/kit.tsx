"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The small, repeated pieces of the Discover feature language, named once so
 * every research screen draws them identically: the uppercase section label,
 * the divided stat strip, the chip, the sticky action bar and its buttons.
 */

/** The screen scroller under a FeatureHeader. The class names are the
 *  reference's on purpose: the desktop popup rules in design-system.css key
 *  off `overflow-y-auto`, `py-5` and `pb-[130px]` to re-pad it in a popup. */
export const SCROLL_BODY =
  "flex-1 overflow-y-auto px-5 py-5 pb-[130px] scrollbar-none";

/** The reference's full-width primary action. */
export const PRIMARY_BUTTON =
  "w-full bg-brand-gradient text-white py-3.5 rounded-full font-medium text-xs uppercase tracking-wide hover:brightness-110 transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:brightness-100";

/** Quiet text action under a primary one (Reset, Modify…). */
export const QUIET_BUTTON =
  "w-full text-slate-400 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1.5 hover:text-[#0A1F4D] dark:hover:text-white transition-colors";

/** The header's circular icon button (share, download, notify). */
export const CIRCLE_BUTTON =
  "w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover-tint transition-colors shrink-0 disabled:opacity-50";

/** A labelled pill in a header's right slot. */
export const HEADER_PILL =
  "h-8 rounded-full border border-slate-100 px-3 flex items-center gap-1.5 text-[11px] font-medium text-[#0A1F4D] hover-tint transition-colors shrink-0";

export function Label({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h4
      className={cn(
        "text-[10px] font-medium tracking-wider text-slate-400 uppercase",
        className,
      )}
    >
      {children}
    </h4>
  );
}

export function StatStrip({
  stats,
}: {
  stats: {
    label: string;
    value: ReactNode;
    accent?: boolean;
    /** Drawn in rose: a figure that stands against the reader — the quote's
     *  Balance when it does not cover the price. */
    negative?: boolean;
  }[];
}) {
  return (
    <div className="grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100 dark:divide-slate-800/60 dark:border-slate-800/60">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="px-3 py-3.5 text-center"
        >
          <p
            className={cn(
              "font-geist truncate text-sm font-medium",
              stat.negative
                ? "text-rose-500 dark:text-rose-400"
                : stat.accent
                  ? "text-[#0A9E6E]"
                  : "text-[#0A1F4D] dark:text-white",
            )}
          >
            {stat.value}
          </p>
          <p className="mt-0.5 text-[9px] leading-tight tracking-wider text-slate-400 uppercase">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}

export type ChipTone = "blue" | "mint" | "amber" | "rose" | "slate";

const CHIP_TONES: Record<ChipTone, string> = {
  blue: "bg-[#063BAA]/8 text-[#063BAA]",
  mint: "bg-[#97edcc]/30 text-[#0A9E6E]",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  slate: "bg-slate-100 text-slate-500 dark:bg-slate-800",
};

export function Chip({
  children,
  tone = "blue",
  className,
}: {
  children: ReactNode;
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium tracking-wider whitespace-nowrap uppercase",
        CHIP_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** The sticky bar under a screen's scroller. `mb-[76px]` clears the mobile
 *  bottom nav; the popup rules drop it on desktop. */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background/80 mb-[76px] shrink-0 border-t border-slate-100 px-5 py-3 backdrop-blur-md">
      {children}
    </div>
  );
}

/** A quiet placeholder block while a query is in flight. */
export function Placeholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-nested animate-pulse bg-slate-100 dark:bg-slate-800",
        className,
      )}
    />
  );
}

/** A one-line notice: an icon and a sentence, toned by what it says. */
export function Notice({
  icon,
  tone = "slate",
  children,
}: {
  icon?: ReactNode;
  tone?: "slate" | "mint" | "amber" | "rose";
  children: ReactNode;
}) {
  const tones = {
    slate: "text-slate-500 dark:text-slate-400",
    mint: "text-[#0A9E6E]",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-500",
  } as const;
  return (
    <div
      className={cn(
        "flex items-start gap-2 text-[11px] leading-relaxed",
        tones[tone],
      )}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
