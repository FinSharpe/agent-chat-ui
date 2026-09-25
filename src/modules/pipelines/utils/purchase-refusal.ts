/**
 * The purchase's structured refusals (finsharpe-agents #251), read for the
 * quote screen (#280).
 *
 * Each one is an answer, not a failure, and each has a state of its own on
 * the screen rather than a toast:
 *
 * - **402 `insufficient_credits`** — the Balance did not cover the price when
 *   the debit was tried (it can move between the quote and the click: a chat
 *   turn is charged, an allotment lands). The body carries the Balance read
 *   *after* the refusal, so the quote is re-drawn short from it: Balance in
 *   rose, the shortfall sentence, the Run button off.
 * - **409 `price_changed`** — the repeated `price_minor` is not the current
 *   price. The body carries a fresh quote, which replaces the one on screen,
 *   and a notice says the price moved; the user confirms the new one.
 * - **503 `purchases_unavailable`** — purchases are switched off (R20) or the
 *   cut-over has not finished. Our own sentence, never the server's `detail`.
 *
 * Nothing was debited in any of the three. Keyed on the `error` code, not the
 * status alone: 409 and 503 have other meanings on other routes, and a 503
 * from a Pipeline whose runtime never loaded is a deployment fault, not this.
 */

import type { QuoteResponse } from "@/api/generated/pipelines-apis/models";
import { PipelineApiError } from "../api/pipelines-client";

/** The Balance figures a 402 carries, merged over the quote on screen. */
export interface ShortBalanceFigures {
  price_minor: number;
  balance_minor: number;
  can_afford: boolean;
  shortfall_minor: number;
}

export type PurchaseRefusal =
  | { kind: "short_balance"; figures: ShortBalanceFigures | null }
  | { kind: "price_changed"; quote: QuoteResponse | null }
  | { kind: "unavailable" };

/** A purchase answered 503 `purchases_unavailable` (the server's own copy). */
export const PURCHASES_UNAVAILABLE_NOTICE =
  "Reports are briefly unavailable — try again in a minute.";

/** A purchase answered 409 `price_changed`; the fresh quote is on screen. */
export const PRICE_CHANGED_NOTICE =
  "The price of this report has changed. Nothing was charged — check the new price, then run it again.";

function isMinor(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function figuresOf(body: unknown): ShortBalanceFigures | null {
  const b = body as Partial<Record<keyof ShortBalanceFigures, unknown>> | null;
  if (
    !b ||
    !isMinor(b.price_minor) ||
    !isMinor(b.balance_minor) ||
    !isMinor(b.shortfall_minor)
  ) {
    return null;
  }
  return {
    price_minor: b.price_minor,
    balance_minor: b.balance_minor,
    // The server's verdict on the Balance it re-read. False but for a race:
    // credits that landed between the refusal and the re-read make it true,
    // and then the button is live again rather than dead with no shortfall.
    can_afford: b.can_afford === true,
    shortfall_minor: b.shortfall_minor,
  };
}

function freshQuoteOf(body: unknown): QuoteResponse | null {
  const quote = (body as { quote?: unknown } | null)?.quote;
  if (!quote || typeof quote !== "object") return null;
  const q = quote as Partial<QuoteResponse>;
  return isMinor(q.price_minor) &&
    isMinor(q.balance_minor) &&
    typeof q.can_afford === "boolean"
    ? (quote as QuoteResponse)
    : null;
}

/**
 * Which refusal a purchase error is, or null for anything else (a network
 * failure, a 404, an unexpected 5xx) — those keep the generic toast.
 *
 * Every 402 is a short Balance: the status predates the structured body, and
 * a body without figures still means exactly that (the quote is refetched to
 * find the figures instead).
 */
export function purchaseRefusalOf(error: unknown): PurchaseRefusal | null {
  if (!(error instanceof PipelineApiError)) return null;
  if (error.status === 402) {
    return { kind: "short_balance", figures: figuresOf(error.body) };
  }
  if (error.status === 409 && error.code === "price_changed") {
    return { kind: "price_changed", quote: freshQuoteOf(error.body) };
  }
  if (error.status === 503 && error.code === "purchases_unavailable") {
    return { kind: "unavailable" };
  }
  return null;
}

/**
 * The quote to show after a refusal, or undefined when the refusal carries
 * nothing to draw it from — the caller refetches the quote then.
 *
 * A short Balance keeps everything the quote said about the report (target,
 * gaps, vintages) and takes the figures the refusal carries: the Balance the
 * server just judged, and its own `can_afford` and `shortfall_minor` — never
 * re-derived here from the integers. A changed price takes the fresh quote
 * whole.
 */
export function quoteAfterRefusal(
  current: QuoteResponse | undefined,
  refusal: PurchaseRefusal,
): QuoteResponse | undefined {
  switch (refusal.kind) {
    case "short_balance":
      if (!current || !refusal.figures) return undefined;
      return { ...current, ...refusal.figures };
    case "price_changed":
      return refusal.quote ?? undefined;
    case "unavailable":
      return current;
  }
}
