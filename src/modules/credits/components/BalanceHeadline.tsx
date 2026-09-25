import type { ReactNode } from "react";

import type { UserCredits } from "@/api/generated/credits-apis/models";

import {
  BALANCE_LABEL,
  BELOW_ZERO_LINE,
  CREDITS_WORD,
} from "../constants/copy";
import { formatCredits } from "../utils/format";
import { creditStateOf } from "../utils/history";
import {
  RequestCreditsButton,
  ShortBalanceNotice,
} from "./RequestCreditsButton";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="px-1 text-[10px] font-medium tracking-[0.08em] text-slate-400 uppercase">
      {children}
    </p>
  );
}

/**
 * The Credits page's headline (A · Statement, #231 decision 2): the Balance
 * as one hero numeral with "credits" beside it, the state line under it, and
 * the Credit Request — offered at every Balance, never only when low.
 *
 * - at or above zero: nothing but the figure and the request;
 * - below zero, nobody refused: the true figure and "Your balance is below
 *   zero." — no rose, no notice (decision 10);
 * - `gated`: the Short Balance notice with the request inside it.
 */
export function BalanceHeadline({
  credits,
  requestHref,
}: {
  credits: UserCredits;
  requestHref: string;
}) {
  const state = creditStateOf(credits);
  return (
    <section
      aria-label={BALANCE_LABEL}
      className="flex flex-col gap-3"
    >
      <Eyebrow>{BALANCE_LABEL}</Eyebrow>
      <p className="flex items-baseline gap-2 px-1">
        <span
          data-testid="credits-balance"
          className="font-geist text-[34px] leading-none font-medium tracking-[-0.02em] text-[#0A1F4D] tabular-nums dark:text-white"
        >
          {formatCredits(credits.balance_minor)}
        </span>
        <span className="text-[13px] text-slate-500 dark:text-slate-400">
          {CREDITS_WORD}
        </span>
      </p>
      {state === "short_balance" ? (
        <ShortBalanceNotice requestHref={requestHref} />
      ) : (
        <>
          {state === "below_zero" && (
            <p className="px-1 text-[13px] text-slate-500 dark:text-slate-400">
              {BELOW_ZERO_LINE}
            </p>
          )}
          <RequestCreditsButton href={requestHref} />
        </>
      )}
    </section>
  );
}

export function BalanceSkeleton() {
  return (
    <div
      aria-hidden
      className="flex flex-col gap-3"
    >
      <span className="h-3 w-16 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
      <span className="rounded-nested h-9 w-40 animate-pulse bg-slate-100 dark:bg-slate-800" />
      <span className="h-9 w-36 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}
