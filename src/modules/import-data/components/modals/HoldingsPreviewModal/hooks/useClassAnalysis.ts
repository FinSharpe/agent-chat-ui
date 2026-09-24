"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Control, useWatch } from "react-hook-form";
import type { AnalysisKind } from "@/modules/import-data/types/holdings-analysis";
import { analysisRequest, toClassAnalysis } from "../utils/class-analysis";
import type { HoldingWithQuantity } from "../utils/holdings-transformer";
import type { HoldingFormData } from "./useHoldingsForm";

/** Quiet period after a ledger edit before the analysis re-runs. */
const EDIT_DEBOUNCE_MS = 700;

class AnalysisError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

async function fetchAnalysis(url: string, body: string) {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch {
    throw new AnalysisError("The analysis service could not be reached.");
  }
  if (!res.ok) {
    throw new AnalysisError(
      res.status >= 500
        ? "The analysis service did not respond."
        : "The analysis service could not read these holdings.",
      res.status,
    );
  }
  return (await res.json()) as Record<string, unknown>;
}

/**
 * The class's analysis, fetched as soon as the holdings are there — opening
 * "Analyse" is the request; there is no second button. The request follows the
 * editable ledger: adding, removing or re-quantifying a holding re-runs it
 * after a short pause. Keyed on the request body, so reopening the view on an
 * unchanged book reuses the last answer instead of waiting again.
 */
export function useClassAnalysis(
  kind: AnalysisKind,
  control: Control<HoldingFormData>,
  enabled: boolean,
) {
  const holdings = useWatch({ control, name: "holdings" }) as
    | HoldingWithQuantity[]
    | undefined;

  const request = useMemo(
    () => analysisRequest(kind, holdings ?? []),
    [kind, holdings],
  );
  const body = JSON.stringify(request.body);

  // The first request goes out at once; only edits after it wait.
  const [sent, setSent] = useState({ body, count: request.itemCount });
  useEffect(() => {
    const next = { body, count: request.itemCount };
    if (sent.count === 0) {
      if (next.count > 0 || next.body !== sent.body) setSent(next);
      return;
    }
    if (next.body === sent.body) return;
    const id = setTimeout(() => setSent(next), EDIT_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [body, request.itemCount, sent]);

  const query = useQuery({
    queryKey: ["holdings-analysis", request.url, sent.body],
    queryFn: () => fetchAnalysis(request.url, sent.body),
    enabled: enabled && sent.count > 0,
    select: (json) => toClassAnalysis(kind, json),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    // Keep the last answer on screen while an edit re-runs it.
    placeholderData: (previous) => previous,
  });

  return {
    analysis: query.data ?? null,
    isLoading: query.isPending && query.fetchStatus !== "idle",
    isRefreshing: query.isFetching && query.isPlaceholderData,
    /** An answer is on its way — fetching, or an edit waiting out the
     * debounce — so what is on screen may not match the ledger yet. */
    isBusy: query.isFetching || body !== sent.body,
    isError: query.isError,
    error: query.error as AnalysisError | null,
    retry: () => void query.refetch(),
    /** Nothing to send: no holding has a positive quantity. */
    isEmpty: sent.count === 0,
    /** There is a book to analyse and no answer yet, not even a failed one —
     * including the render before the first request goes out. */
    isAwaitingFirst:
      enabled && request.itemCount > 0 && query.data == null && !query.isError,
  };
}
