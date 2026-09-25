/**
 * What each section of the Credits page draws, decided from its read alone —
 * pure, so the one rule that matters is checked (`pnpm check:credits`):
 * a read that failed says so, and is never drawn as a zero Balance or an
 * empty History. "We could not load it" is not "you have none".
 *
 * A read that has data shows it even while a refetch of it fails: the figure
 * on screen is the last one the server gave, not a guess.
 */

export type BalanceSection = "loading" | "error" | "ready";

export function balanceSection(read: {
  data?: unknown;
  isError: boolean;
}): BalanceSection {
  if (read.data) return "ready";
  return read.isError ? "error" : "loading";
}

export type HistorySection = "loading" | "error" | "empty" | "list";

export function historySection(
  read: { data?: unknown; isError: boolean },
  rowCount: number,
): HistorySection {
  if (!read.data) return read.isError ? "error" : "loading";
  return rowCount === 0 ? "empty" : "list";
}

/** Under the list: older pages to ask for, a failed ask, or the end. */
export type OlderControl = "more" | "error" | "none";

export function olderControl(read: {
  hasNextPage: boolean;
  isFetchNextPageError: boolean;
}): OlderControl {
  if (read.isFetchNextPageError) return "error";
  return read.hasNextPage ? "more" : "none";
}
