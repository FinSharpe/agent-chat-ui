"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarketNews, fetchMarketNewsPage } from "../api/market-news";

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

/**
 * Page 1 of Discover's Market news list; later pages go through the pager,
 * which lives with the page — so the list starts over from page 1 each time
 * it opens, as finsharpe-mobile's `marketNewsListProvider` does. The cached
 * page 1 only saves the re-mounts a wait.
 */
export function useMarketNewsFirstPage() {
  return useQuery({
    queryKey: ["market-news-list"],
    // No abort signal: the Discover feature remounts while it slides in, and
    // a cancelled page 1 would be asked for again on every mount.
    queryFn: () => fetchMarketNewsPage(1),
    staleTime: 60 * 1000,
    retry: 1,
  });
}
