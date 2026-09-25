"use client";

import Link from "next/link";

import { CREDITS_ROUTE } from "../constants/routes";
import { useCreditBalance, useCreditRequestHref } from "../hooks/useCredits";
import { readCreditsCarrier, type ChatCreditsCarrier } from "../utils/carrier";
import { balanceLabel } from "../utils/format";
import { ShortBalanceNotice } from "./RequestCreditsButton";

/**
 * Credits where they meet chat (finsharpe-agents#282, after #231 decisions 5–7
 * and finsharpe-mobile's #281): what an answer's `credits` carrier draws, as a
 * sibling under the answer card in the turn's stack, outside the bubble.
 *
 * - `{kind: "charge"}` → the charge label: `0.42 credits` — two decimals, the
 *   word "credits" always, `0.00 credits` for a zero — muted and
 *   right-aligned under the card, opening the Credits page. Under the card
 *   and not in the `CommandBar`, which is a hover-only pill and would hide it
 *   (#231 decision 5 amends #223 §3).
 * - `{kind: "refused"}` → the Short Balance notice with the Request credits
 *   pill beside the refusal, whose sentence is an ordinary answer card with
 *   Copy and Regenerate and no label (decision 6).
 * - no carrier → nothing. Whether there is one is the agents' decision (staff
 *   alone in Shadow Mode, every account once enforced); nothing here decides
 *   it, and the composer never reads it (decision 7: it stays live).
 *
 * Only `charge_minor` is ever read off a carrier, so no USD figure, rate or
 * token count can reach the screen from one (B6).
 */
export function TurnCredits({ message }: { message: unknown }) {
  const carrier = readCreditsCarrier(message);
  return carrier ? <TurnCreditsView carrier={carrier} /> : null;
}

export function TurnCreditsView({ carrier }: { carrier: ChatCreditsCarrier }) {
  return carrier.kind === "charge" ? (
    <ChargeLabel chargeMinor={carrier.chargeMinor} />
  ) : (
    <RefusalCredits />
  );
}

/** The turn's Charge, as the History and the Balance say credits. */
export function ChargeLabel({ chargeMinor }: { chargeMinor: number }) {
  return (
    <div className="-mt-1 flex max-w-[92%] justify-end">
      <Link
        href={CREDITS_ROUTE}
        data-testid="charge-label"
        className="rounded-md px-1 py-0.5 text-[11.5px] leading-none text-slate-400 tabular-nums transition-colors hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-[#063BAA]/30 focus-visible:outline-none dark:text-slate-500 dark:hover:text-slate-300"
      >
        {balanceLabel(chargeMinor)}
      </Link>
    </div>
  );
}

/**
 * The Short Balance notice beside a refused answer: the Credits page's own
 * component, so the two places say the same words. Its Request credits
 * carries the Balance when it has been read — the refusal's carrier landing
 * reads it again (`useRefreshCreditsOnCarrier`) — and leaves the line out
 * when it has not.
 */
export function RefusalCredits() {
  const { data } = useCreditBalance();
  const requestHref = useCreditRequestHref(data?.balance_minor);
  return (
    <div
      data-testid="short-balance-refusal"
      className="max-w-[92%]"
    >
      <ShortBalanceNotice requestHref={requestHref} />
    </div>
  );
}
