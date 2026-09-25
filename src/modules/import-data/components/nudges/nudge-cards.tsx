"use client";

import type {
  FundamentalCard,
  NudgeBadge,
  TechnicalCard,
} from "@/api/generated/nudge-apis/models";
import {
  StatusChip,
  type ChipTone,
} from "@/modules/discover/components/shared/FeedKit";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { signalSymbol } from "../../utils/chat-handoffs";

/* The Deep Dive rows' Technical and Fundamental cards — finsharpe-mobile's
   `_SignalCard` (`portfolio_tab.dart`, #140); change the two together. The
   News row mounts the shared discover `NewsCard` instead, as mobile does. */

/** One row card: the reference news card's 270×200, as on Home. */
export const SIGNAL_CARD_WIDTH = 270;
export const SIGNAL_CARD_HEIGHT = 200;

/** Mobile's `chipToneOf`: a negative verdict reads as a warning, not a loss. */
const chipToneOf = (badge?: NudgeBadge | null): ChipTone =>
  badge?.tone === "positive"
    ? "positive"
    : badge?.tone === "negative"
      ? "warning"
      : "neutral";

/**
 * Symbol and verdict up top, the served line, then a hairline footer with
 * `Ask AI →` on the right. Only the link is live — the card body stays inert
 * (mobile's variant B) — and there is no timestamp beside it, because the
 * feed serves none and the page invents nothing.
 */
export function SignalCard({
  card,
  onAsk,
}: {
  card: TechnicalCard | FundamentalCard;
  onAsk: () => void;
}) {
  const label = signalSymbol(card.holding);
  return (
    <div
      style={{ width: SIGNAL_CARD_WIDTH, height: SIGNAL_CARD_HEIGHT }}
      className="glass-card rounded-card premium-shadow-sm flex shrink-0 snap-start flex-col px-4 pt-4"
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[10px] font-medium tracking-wider text-slate-400 uppercase">
          {label.toUpperCase()}
        </span>
        <StatusChip
          label={card.badge?.label ?? "Signal"}
          tone={chipToneOf(card.badge)}
        />
      </div>
      <p className="mt-2 line-clamp-5 min-h-0 flex-1 text-[11px] leading-[1.5] text-slate-500 dark:text-slate-400">
        {card.line}
      </p>
      <div className="mt-2 flex h-11 items-center justify-end border-t border-slate-100 dark:border-slate-800/60">
        <button
          type="button"
          onClick={onAsk}
          aria-label={`Ask AI about ${label}`}
          className="rounded-tile flex h-11 items-center gap-1 pl-3 text-[10px] font-medium text-[#063BAA] hover:underline dark:text-[#8FB4FF]"
        >
          Ask AI <ArrowRight size={10} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------ Loading / empty ------------------------------------ */

const shimmer =
  "block animate-pulse rounded bg-slate-100 dark:bg-slate-800 motion-reduce:animate-none";

export function SignalCardSkeleton() {
  return (
    <div
      style={{ width: SIGNAL_CARD_WIDTH, height: SIGNAL_CARD_HEIGHT }}
      className="glass-card rounded-card flex shrink-0 snap-start flex-col gap-3 p-4"
      aria-hidden="true"
    >
      <div className="flex justify-between">
        <span className={`${shimmer} h-3 w-16`} />
        <span className={`${shimmer} h-4 w-14 rounded-full`} />
      </div>
      <span className={`${shimmer} h-3 w-full`} />
      <span className={`${shimmer} h-3 w-full`} />
      <span className={`${shimmer} h-3 w-2/3`} />
      <span className={`${shimmer} mt-auto mb-1 h-3 w-12 self-end`} />
    </div>
  );
}

/** Quiet message card for a row that failed to load. */
export function RowMessage({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="glass-card rounded-card flex items-center justify-between gap-3 px-5 py-4">
      <p className="text-[11px] leading-relaxed text-slate-400">{children}</p>
      {action}
    </div>
  );
}
