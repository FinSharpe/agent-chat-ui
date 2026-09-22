"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import {
  StockSearchResponse,
  MutualFundSearchResponse,
} from "@/types/search-api.types";
import { SEARCH_CONFIG } from "../utils/holdings-constants";

/**
 * Simple debounce hook
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Fetches search results from API
 */
async function fetchSearchResults(
  query: string,
  consentType: ConsentType,
): Promise<
  StockSearchResponse["results"] | MutualFundSearchResponse["results"]
> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("Search API URL is not configured");
  }

  // ETFs trade on the exchange, so they come from the stock search (the ETF
  // holding transform expects a stock result — the MF search would throw).
  const endpoint =
    consentType === ConsentType.EQUITIES || consentType === ConsentType.ETF
      ? `${apiUrl}/utilities/search/stocks`
      : `${apiUrl}/utilities/search/mutual-funds`;

  const requestBody = { query, limit: SEARCH_CONFIG.resultLimit };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Search failed (${response.status})`);
  }

  const data: StockSearchResponse | MutualFundSearchResponse =
    await response.json();
  return data.results;
}

/**
 * Hook for searching holdings with React Query
 * Provides automatic caching, deduplication, and loading states
 *
 * @param consentType - Type of consent to determine search endpoint
 * @returns Search query state, results, loading state, and setter
 */
export function useHoldingsSearch(consentType: ConsentType) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, SEARCH_CONFIG.debounceMs);

  const {
    data: searchResults,
    isLoading: isSearching,
    error,
  } = useQuery({
    queryKey: ["holdings-search", consentType, debouncedQuery],
    queryFn: () => fetchSearchResults(debouncedQuery, consentType),
    enabled: !!debouncedQuery.trim(),
    staleTime: SEARCH_CONFIG.staleTimeMs,
    retry: false,
  });

  return {
    /** Current search query value */
    searchQuery,
    /** Set search query value */
    setSearchQuery,
    /** Search results (null if no search or empty query) */
    searchResults: searchResults ?? null,
    /** Whether search is in progress */
    isSearching,
    /** Search error if any */
    error,
  };
}
