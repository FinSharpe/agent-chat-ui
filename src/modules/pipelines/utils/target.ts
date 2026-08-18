/**
 * Reading what a Run is *about*.
 *
 * A Pipeline declares what it targets and the catalog carries the declaration
 * (#110), so nothing here has to know a Pipeline by name: an instrument
 * Pipeline is bought against a symbol, a market Pipeline against nothing at
 * all, and both answers come off the wire.
 */

import type { CatalogEntry } from "../types/pipelines.types";

/** The target symbol, or the empty string — the target is a loose dict. */
export function targetSymbol(target: unknown): string {
  if (target && typeof target === "object" && "symbol" in target) {
    return String((target as { symbol?: unknown }).symbol ?? "");
  }
  return "";
}

/**
 * What stands where a ticker would.
 *
 * An instrument target is its symbol. A market target has no ticker at all, so
 * it names the market it covers: the slot appears on the run view, the report
 * header, the library row and the Summary Card, and an empty one there reads
 * as a figure that failed to load rather than as a report about everything.
 */
export function targetLabel(target: unknown): string {
  const symbol = targetSymbol(target);
  if (symbol) return symbol;
  if (!target || typeof target !== "object") return "";
  const { kind, market } = target as { kind?: unknown; market?: unknown };
  if (kind !== "market") return "";
  return typeof market === "string" && market ? `${market} market` : "Market";
}

/** Whether a resolved target is the market rather than one instrument. */
export function isMarketTarget(target: unknown): boolean {
  return (
    !!target &&
    typeof target === "object" &&
    (target as { kind?: unknown }).kind === "market"
  );
}

/**
 * Whether buying this Pipeline needs a stock chosen first.
 *
 * An entry that has not loaded yet reads as needing one — the conservative
 * half, because it only ever asks for a symbol a market Pipeline would ignore.
 * The other way round would offer Run on a Pipeline that cannot run without a
 * stock.
 */
export function needsSymbol(entry: CatalogEntry | undefined): boolean {
  return entry?.target_kind !== "market";
}

/**
 * Whether the Steps run in the order the catalog lists them.
 *
 * Read off the same declaration: a market Pipeline narrows the whole market
 * down to a few names, and that narrowing is a funnel — each Step consumes the
 * last one's output. An instrument Pipeline's Steps are independent views of
 * one stock, researched in parallel, so numbering them would assert an order
 * that is not there.
 */
export function stepsAreOrdered(entry: CatalogEntry | undefined): boolean {
  return entry?.target_kind === "market";
}
