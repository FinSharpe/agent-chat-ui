"use client";
import type {
  MutualFundSearchResponse,
  StockSearchResponse,
} from "@/types/search-api.types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export interface SecuritySuggestion {
  /** What gets saved to the group — a ticker, or a scheme name. */
  value: string;
  /** Full name, shown as the chip's tooltip. */
  detail?: string;
}

/**
 * Suggestions for the watchlist popups from the real security search
 * (`/api/utilities/search/stocks` and `/mutual-funds`, as the holdings editor
 * uses), debounced while the user types.
 */
export function useSecuritySearch(
  kind: "stocks" | "mutual-funds",
  query: string,
) {
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const result = useQuery({
    queryKey: ["watchlist-search", kind, debounced],
    enabled: debounced.length >= 2,
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }): Promise<SecuritySuggestion[]> => {
      const res = await fetch(`/api/utilities/search/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: debounced, limit: 8 }),
        signal,
      });
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      if (kind === "stocks") {
        const data = (await res.json()) as StockSearchResponse;
        return (data.results ?? []).map((r) => ({ value: r.symbol, detail: r.compname }));
      }
      const data = (await res.json()) as MutualFundSearchResponse;
      return (data.results ?? []).map((r) => ({ value: r.sName, detail: r.legalNames }));
    },
  });

  return {
    suggestions: debounced.length >= 2 ? (result.data ?? []) : [],
    isSearching: result.isFetching,
    isError: result.isError,
  };
}
