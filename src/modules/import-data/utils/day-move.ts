/**
 * The net-worth card's day move — finsharpe-mobile's `_SummaryCard`
 * (`portfolio_tab.dart`) and `ClassAnalytics.dayMoveInr` (`analytics_api.dart`).
 * Change the two apps together. Checks: `pnpm check:day-move`.
 *
 * Each invested class's analysis carries `snapshot.day_move.pct`: its book as
 * it stands today, moved over the latest session. That is the only return this
 * card may state — anything longer prices today's holdings backwards over a
 * window they were not held for (finsharpe-agents#92).
 */
import type { FiBlob } from "../types/aa";
import { isInvestments } from "../types/aa";

/** One analysis request line: the ISIN and the units held across accounts. */
export interface DayMoveItem {
  isin: string;
  quantity: number;
}

/**
 * A class's holdings across its consents, one line per ISIN with the units
 * summed — mobile's `mergeHoldingsByIsin`. A holding with no ISIN is kept as
 * its own line; the request builder drops anything without units.
 */
export function classItems(blobs: FiBlob[]): DayMoveItem[] {
  const items: DayMoveItem[] = [];
  const indexByIsin = new Map<string, number>();
  for (const blob of blobs) {
    if (!isInvestments(blob.normalized)) continue;
    for (const h of blob.normalized.holdings) {
      const units = Number.isFinite(h.units) ? h.units : 0;
      if (!h.isin) {
        items.push({ isin: h.isin, quantity: units });
        continue;
      }
      const at = indexByIsin.get(h.isin);
      if (at === undefined) {
        indexByIsin.set(h.isin, items.length);
        items.push({ isin: h.isin, quantity: units });
      } else {
        items[at] = { isin: h.isin, quantity: items[at].quantity + units };
      }
    }
  }
  return items;
}

/**
 * Today's rupee move of a position worth `currentValue` that moved `pct` over
 * the session. The move is measured on the current book, so yesterday's value
 * of that same book is today's divided by (1 + r).
 */
export function dayMoveInr(currentValue: number, pct: number): number | null {
  const base = 1 + pct / 100;
  if (base <= 0) return null;
  return currentValue - currentValue / base;
}

export interface ClassDayMove {
  /** The class's current value; null while it has none. */
  value: number | null;
  /** The class's session move, percent; null when the analysis gave none. */
  pct: number | null;
}

export interface PortfolioDayMove {
  /** Rupees, summed across the invested classes. */
  delta: number;
  /** Relative to yesterday's value, as brokers quote a day change. */
  pct: number;
}

/**
 * The book's day move across every invested class, or null. Honest partial
 * data is hidden: one class without a move and there is no line at all, since
 * a sum over some of the book would be quoted as the whole of it.
 */
export function portfolioDayMove(
  classes: ClassDayMove[],
  investmentsTotal: number,
): PortfolioDayMove | null {
  if (classes.length === 0 || investmentsTotal <= 0) return null;
  let delta = 0;
  for (const c of classes) {
    if (c.value == null || c.pct == null) return null;
    const move = dayMoveInr(c.value, c.pct);
    if (move == null) return null;
    delta += move;
  }
  const yesterday = investmentsTotal - delta;
  return { delta, pct: yesterday <= 0 ? 0 : (delta / yesterday) * 100 };
}

/** `+₹4,213 today` / `-₹980 today` — mobile's line, whole rupees. */
export function dayMoveLine(delta: number): string {
  const rupees = Math.round(Math.abs(delta)).toLocaleString("en-IN");
  return `${delta >= 0 ? "+" : "-"}₹${rupees} today`;
}

/** `+0.42% today` — mobile's pill, `signedPct(pct, decimals: 2)`. */
export function dayMovePill(pct: number): string {
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}% today`;
}
