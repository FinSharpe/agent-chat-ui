"use client";

import { cn } from "@/lib/utils";

import { BALANCE_ERROR_TITLE } from "../constants/copy";
import { useCreditBalance } from "../hooks/useCredits";
import { formatCredits } from "../utils/format";

/**
 * The Balance as the account rows show it, trailing the word "Credits": the
 * true figure ("12.40", "−13.10") and no state words — the Short Balance has
 * its two homes already, the Credits page and a refused answer (#231
 * decision 1). It trails the sidebar footer's row and the phone account
 * sheet's, and no other: Profile's Credits row is a link without it (owner,
 * 2026-09-25).
 *
 * Each figure on screen is an observer of the Balance, and every observer
 * reads afresh when it mounts: opening the account sheet is what refetches
 * it. A Balance that could not be read shows a dash, never a zero.
 */
export function CreditsFigure({ className }: { className?: string }) {
  const { data, isError } = useCreditBalance();
  if (data) {
    return (
      <span
        data-testid="credits-figure"
        className={cn("tabular-nums", className)}
      >
        {formatCredits(data.balance_minor)}
      </span>
    );
  }
  if (isError) {
    return (
      <span
        title={BALANCE_ERROR_TITLE}
        aria-label={BALANCE_ERROR_TITLE}
        className={cn("tabular-nums", className)}
      >
        —
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="h-3 w-10 shrink-0 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800"
    />
  );
}
