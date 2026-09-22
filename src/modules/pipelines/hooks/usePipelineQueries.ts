"use client";

/**
 * React Query bindings for the Pipelines surfaces.
 *
 * Keys are `["pipelines", …]` so a single `invalidateQueries` after a purchase
 * or a share change refreshes every list that could have gone stale.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  deletePurchase,
  fetchCatalog,
  fetchOwnedPurchases,
  fetchQuote,
  fetchReport,
  fetchRunStatus,
  fetchSharedReport,
  mintShare,
  purchasePipeline,
  revokeShare,
} from "../api/pipelines-client";
import { searchStocks } from "../api/stock-search";
import { isRunTerminal } from "../types/pipelines.types";
import { isAnswered } from "../utils/errors";

/**
 * Retry only what could plausibly come good on its own: a network error or a
 * 5xx. A 4xx is the server answering — 402 short balance, 404 unknown stock,
 * 409 not published — and replaying it only delays the state the screen has to
 * show. Mirrors the app-wide default in `QueryProvider`, spelled out here
 * because these queries opt out of it for their own reasons.
 */
function retryTransient(failureCount: number, error: unknown): boolean {
  if (isAnswered(error)) return false;
  return failureCount < 2;
}

export const pipelineKeys = {
  all: ["pipelines"] as const,
  catalog: () => ["pipelines", "catalog"] as const,
  run: (runId: string) => ["pipelines", "run", runId] as const,
  report: (runId: string) => ["pipelines", "report", runId] as const,
  purchases: () => ["pipelines", "purchases"] as const,
  shared: (token: string) => ["pipelines", "shared", token] as const,
  search: (query: string) => ["pipelines", "stock-search", query] as const,
};

/* -------------------------------------------------------------------------- */
/* Catalog + target picker                                                    */
/* -------------------------------------------------------------------------- */

export function usePipelineCatalog() {
  return useQuery({
    queryKey: pipelineKeys.catalog(),
    queryFn: ({ signal }) => fetchCatalog(signal),
    // The catalog is a code-defined registry — it changes on deploy, not on
    // the hour.
    staleTime: 10 * 60_000,
  });
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function useStockSearch(query: string) {
  const debouncedQuery = useDebounced(query.trim(), 250);
  const search = useQuery({
    queryKey: pipelineKeys.search(debouncedQuery),
    queryFn: ({ signal }) => searchStocks(debouncedQuery, 8, signal),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60_000,
    retry: false,
  });
  return {
    results: search.data ?? [],
    isSearching: search.isFetching,
    error: search.error,
    /** Retries the same term — the picker's "Try again" after a failed search. */
    retry: search.refetch,
    /** True while the user has typed but the debounce has not fired yet. */
    isPending: query.trim() !== debouncedQuery,
  };
}

/* -------------------------------------------------------------------------- */
/* Quote + purchase                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The quote is a POST that reads: target resolution, coverage declaration,
 * vintage probe, price and balance. Modelled as a query so it caches per
 * (pipeline, symbol) and refetches when the user comes back to it — the
 * balance and the vintage both move.
 */
export function usePipelineQuote(
  pipelineId: string,
  symbol: string | null,
  // Required rather than defaulted to `!!symbol`: a market Pipeline quotes
  // with nothing named, so "has a symbol" stopped being the same question as
  // "is there a target to quote", and a default that answers the old question
  // is one a caller can take by forgetting to think about it.
  { enabled }: { enabled: boolean },
) {
  return useQuery({
    queryKey: ["pipelines", "quote", pipelineId, symbol] as const,
    queryFn: () => fetchQuote(pipelineId, symbol),
    enabled,
    // A quote carries a live balance and a live vintage; never serve a stale
    // one to the screen that takes the money.
    staleTime: 0,
    gcTime: 0,
    // The quote is a POST that only reads, so replaying it is safe. A refusal
    // (402, 404) is never replayed.
    retry: retryTransient,
  });
}

interface PurchaseVars {
  pipelineId: string;
  symbol: string | null;
  threadId?: string | null;
}

export function usePurchasePipeline() {
  const queryClient = useQueryClient();
  // The double-spend guard: a second click while the first request is in
  // flight must not reach the payment boundary. `isPending` alone loses the
  // race between the click handler and the re-render.
  const inFlight = useRef(false);

  const mutation = useMutation({
    mutationFn: (vars: PurchaseVars) =>
      purchasePipeline(vars.pipelineId, vars.symbol, vars.threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.purchases() });
    },
  });

  // Guarded outside the mutation: a refused second call must not become the
  // mutation's latest state, which would read as a failed purchase and
  // re-enable the button while the first one is still being charged.
  const { mutateAsync } = mutation;
  const purchaseOnce = useCallback(
    async (vars: PurchaseVars) => {
      if (inFlight.current) return null;
      inFlight.current = true;
      try {
        return await mutateAsync(vars);
      } finally {
        inFlight.current = false;
      }
    },
    [mutateAsync],
  );

  return {
    ...mutation,
    /** Resolves to null, without a request, while a purchase is in flight. */
    purchaseOnce,
    /** True from the click until the receipt lands — the button's disabled state. */
    isPurchasing: mutation.isPending,
  };
}

/* -------------------------------------------------------------------------- */
/* Run polling                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Poll interval by elapsed time. The stack has no SSE for these routes (the
 * plan: "take whatever the stack already has"), so the run view polls — fast
 * while the user is watching a fresh run, then backing off so a long or stuck
 * run does not hammer the API.
 */
export function runPollInterval(elapsedMs: number): number {
  if (elapsedMs < 30_000) return 2_000;
  if (elapsedMs < 120_000) return 4_000;
  if (elapsedMs < 300_000) return 8_000;
  return 15_000;
}

export function usePipelineRun(runId: string | null) {
  const startedAt = useRef<number>(Date.now());
  // A run id change is a different run — restart the backoff clock.
  const lastRunId = useRef(runId);
  if (lastRunId.current !== runId) {
    lastRunId.current = runId;
    startedAt.current = Date.now();
  }

  return useQuery({
    queryKey: pipelineKeys.run(runId ?? ""),
    queryFn: ({ signal }) => fetchRunStatus(runId as string, signal),
    enabled: !!runId,
    refetchInterval: (query) => {
      if (isRunTerminal(query.state.data?.status)) return false;
      return runPollInterval(Date.now() - startedAt.current);
    },
    // Leaving the tab does not cancel the run; keep watching so the completion
    // notification can fire while the user is elsewhere.
    refetchIntervalInBackground: true,
    // No retry here on purpose: the poll *is* the retry. A failed poll leaves
    // the last known status in `data` alongside the error, which is how the
    // run screen can say "we lost contact" while still showing where the run
    // had got to — and the next tick reconnects on its own.
    retry: false,
  });
}

/* -------------------------------------------------------------------------- */
/* Report                                                                     */
/* -------------------------------------------------------------------------- */

export function usePipelineReport(runId: string | null) {
  return useQuery({
    queryKey: pipelineKeys.report(runId ?? ""),
    queryFn: ({ signal }) => fetchReport(runId as string, signal),
    enabled: !!runId,
    // The document is frozen (ADR-0010): fetched once, never refetched.
    staleTime: Infinity,
    retry: retryTransient,
  });
}

export function useSharedReport(token: string | null) {
  return useQuery({
    queryKey: pipelineKeys.shared(token ?? ""),
    queryFn: ({ signal }) => fetchSharedReport(token as string, signal),
    enabled: !!token,
    staleTime: Infinity,
    // This reader has no account, no shell banner and no second way in, so a
    // blip on the one request they make is worth riding out before the page
    // tells them anything went wrong. A revoked token (404) still answers at
    // once.
    retry: retryTransient,
  });
}

/* -------------------------------------------------------------------------- */
/* Owned reports + sharing                                                    */
/* -------------------------------------------------------------------------- */

export function useOwnedReports() {
  return useQuery({
    queryKey: pipelineKeys.purchases(),
    queryFn: ({ signal }) => fetchOwnedPurchases(signal),
    // In-flight rows go stale on their own schedule; the list is cheap.
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
}

export function useShareActions() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: pipelineKeys.purchases() });

  const mint = useMutation({
    mutationFn: (purchaseId: string) => mintShare(purchaseId),
    onSuccess: invalidate,
  });
  const revoke = useMutation({
    mutationFn: (purchaseId: string) => revokeShare(purchaseId),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (purchaseId: string) => deletePurchase(purchaseId),
    onSuccess: invalidate,
  });

  return { mint, revoke, remove };
}
