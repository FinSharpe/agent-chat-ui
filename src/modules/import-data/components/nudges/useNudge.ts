"use client";

import type { NudgeRequest } from "@/api/generated/nudge-apis/models";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { PortfolioHolding } from "./usePortfolioHoldings";

type NudgeQueryHook<TData> = (
  body: NudgeRequest,
  options?: { query?: { enabled?: boolean } },
) => {
  // The orval fetch client resolves to a `{ data, status, headers }` envelope,
  // so react-query's `data` is that envelope and the payload is at `data.data`.
  data?: { data?: TData; status?: number };
  queryKey: readonly unknown[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => unknown;
};

/** The body every nudge feed takes — one shape, so a list that re-sends the
 *  News row's body (Holdings news) hits the same cache entry. */
export const nudgeRequestBody = (
  holdings: PortfolioHolding[],
): NudgeRequest => ({
  holdings: holdings.map((h) => ({
    type: h.type,
    isin: h.isin,
    name: h.name,
    value: h.value,
  })),
  refresh: false,
});

/**
 * Lazy, refreshable wrapper over a generated nudge query hook: it only fetches
 * once `enabled` (its row is near the viewport) and the user has holdings.
 */
export function useNudge<TData>(
  hook: NudgeQueryHook<TData>,
  fetchFn: (body: NudgeRequest) => Promise<unknown>,
  holdings: PortfolioHolding[],
  enabled: boolean,
) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stable body — `refresh` is NOT in the query key, so the lazy read and the
  // manual refresh share one cache entry (no key churn, no skeleton flash).
  const body = useMemo(() => nudgeRequestBody(holdings), [holdings]);

  const query = hook(body, {
    query: { enabled: enabled && holdings.length > 0 },
  });

  // Manual refresh: a single imperative call with refresh:true, written straight
  // into the existing cache entry — one request, no key change, no glitch.
  const triggerRefresh = async () => {
    if (holdings.length === 0) return;
    setIsRefreshing(true);
    try {
      const fresh = await fetchFn({ ...body, refresh: true });
      queryClient.setQueryData(query.queryKey, fresh);
    } catch {
      // Keep showing existing data if the refresh fails.
    } finally {
      setIsRefreshing(false);
    }
  };

  const envelope = query.data;
  const failed =
    query.isError || (envelope?.status != null && envelope.status >= 400);

  return {
    data: failed ? undefined : envelope?.data,
    isPending: query.isLoading,
    isError: failed,
    isFetching: query.isFetching || isRefreshing,
    triggerRefresh,
    retry: () => query.refetch(),
    body,
  };
}
