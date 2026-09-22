import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import type {
  EquityHolding,
  ETFHolding,
  MutualFundHolding,
} from "@/lib/moneyone/moneyone.types";
import type { HoldingWithQuantity } from "./holdings-transformer";

/**
 * Per-unit price the FI data carries for a holding: last traded price for
 * equities, NAV for mutual funds and ETFs. 0 when unknown (e.g. a holding
 * added from search), so its value reads as unavailable rather than wrong.
 */
export function unitPrice(
  holding: HoldingWithQuantity,
  consentType: ConsentType,
): number {
  const raw =
    consentType === ConsentType.EQUITIES
      ? (holding as EquityHolding).lastTradedPrice
      : (holding as MutualFundHolding | ETFHolding).nav;
  const price = parseFloat(raw ?? "");
  return Number.isFinite(price) && price > 0 ? price : 0;
}

/** Secondary line under a holding's name: category for funds, else ISIN. */
export function holdingSubtitle(
  holding: HoldingWithQuantity,
  consentType: ConsentType,
): string {
  if (consentType === ConsentType.MUTUAL_FUNDS) {
    const mf = holding as MutualFundHolding;
    return mf.schemeCategory || mf.amc || mf.isin || "";
  }
  return holding.isin || "";
}

export type LedgerTotals = {
  /** Sum of units across holdings. */
  units: number;
  /** Market value of the holdings that carry a price. */
  value: number;
  /** How many holdings have a usable price. */
  priced: number;
  /** Value of each holding, index-aligned with the input. */
  values: number[];
};

/** Live totals for the holdings ledger (recomputed as units are edited). */
export function ledgerTotals(
  holdings: HoldingWithQuantity[] | undefined,
  consentType: ConsentType,
): LedgerTotals {
  const list = holdings ?? [];
  let units = 0;
  let value = 0;
  let priced = 0;
  const values = list.map((h) => {
    const qty = Number(h?.quantity) || 0;
    units += qty;
    const price = h ? unitPrice(h, consentType) : 0;
    if (price > 0) priced += 1;
    const v = qty * price;
    value += v;
    return v;
  });
  return { units, value, priced, values };
}

/** Singular / plural noun for a holding of each asset type. */
export const HOLDING_NOUN: Partial<Record<ConsentType, [string, string]>> = {
  [ConsentType.EQUITIES]: ["stock", "stocks"],
  [ConsentType.MUTUAL_FUNDS]: ["fund", "funds"],
  [ConsentType.ETF]: ["ETF", "ETFs"],
};

export function holdingNoun(consentType: ConsentType, n: number) {
  const [one, many] = HOLDING_NOUN[consentType] ?? ["holding", "holdings"];
  return n === 1 ? one : many;
}
