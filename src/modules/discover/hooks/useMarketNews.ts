"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarketNews } from "../api/market-news";

/**
 * The Nifty 50 headline feed. One query key, so Home's carousel and the news
 * page share a single fetch and can never show different headlines.
 *
 * The backend caches the feed for about fifteen minutes, so a shorter stale
 * time here would only re-ask for the same bytes.
 */
export function useMarketNews() {
  return useQuery({
    queryKey: ["market-news"],
    queryFn: ({ signal }) => fetchMarketNews(signal),
    staleTime: 10 * 60 * 1000,
    // One retry: a feed that failed twice is reported, not hidden behind a
    // spinner that keeps trying.
    retry: 1,
  });
}
