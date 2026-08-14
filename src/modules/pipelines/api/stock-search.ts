/**
 * The target picker's search, over the existing `POST /api/search/stocks`.
 *
 * Hand-written rather than generated: the search endpoint is not part of any
 * orval group in this repo (`useHoldingsSearch` calls it the same way), and
 * the picker needs only the one call.
 */

import type {
  StockSearchResponse,
  StockSearchResult,
} from "@/types/search-api.types";

export async function searchStocks(
  query: string,
  limit = 8,
  signal?: AbortSignal,
): Promise<StockSearchResult[]> {
  const res = await fetch("/api/utilities/search/stocks", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, limit }),
    signal,
  });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const data = (await res.json()) as StockSearchResponse;
  return data.results ?? [];
}
