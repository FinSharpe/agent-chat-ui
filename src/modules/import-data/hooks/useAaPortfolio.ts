"use client";
import {
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { AaError, getFiData, listConsents, refreshConsent } from "../api/aa-client";
import { useAaTroubleStore } from "../store/useAaTroubleStore";
import type { ConsentRecord, FiBlob } from "../types/aa";
import {
  buildPositions,
  type ClassPosition,
  type ConsentTrouble,
} from "../utils/aa-fold";

export const AA_CONSENTS_KEY = ["aa", "consents"] as const;
export const aaFiDataKey = (consentID: string) =>
  ["aa", "fi-data", consentID] as const;

/** Poll budgets, matching finsharpe-mobile's `fetchWithRetry` callers. */
export const POLL = {
  /** Post-approval adoption and first-sync recovery. */
  adopt: { attempts: 10, interval: 5_000 },
  /** Manual per-row Sync. */
  manual: { attempts: 6, interval: 5_000 },
  /** The late-FIP sweep, two minutes after linking. */
  sweep: { attempts: 4, interval: 8_000 },
  maxInterval: 30_000,
} as const;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Poll `fi-data` until it lands. A network blip mid-poll consumes an attempt
 * rather than aborting the whole recovery; only a dead consent stops early.
 */
export async function fetchWithRetry(
  consentID: string,
  { attempts, interval }: { attempts: number; interval: number },
): Promise<FiBlob> {
  let delay = interval;
  for (let attempt = 1; ; attempt++) {
    try {
      return await getFiData(consentID, { includeRaw: true });
    } catch (error) {
      const aa = error as AaError;
      if (aa?.kind === "consent-dead" || attempt >= attempts) throw error;
      await sleep(delay);
      delay = Math.min(delay * 2, POLL.maxInterval);
    }
  }
}

/** Every consent linked to the signed-in user. The server is the record. */
export function useConsentsQuery() {
  return useQuery({
    queryKey: AA_CONSENTS_KEY,
    queryFn: listConsents,
    staleTime: 30_000,
  });
}

/**
 * One consent's FI data. Shares its cache key with every other reader (the
 * analysis modals, the net-worth card), so nothing is fetched twice.
 */
export function useFiDataQuery(consentID: string | null | undefined) {
  return useQuery({
    queryKey: consentID ? aaFiDataKey(consentID) : ["aa", "fi-data", "none"],
    queryFn: () => getFiData(consentID!, { includeRaw: true }),
    enabled: !!consentID,
    staleTime: 5 * 60_000,
    retry: (failureCount, error) =>
      (error as AaError)?.kind === "transient" && failureCount < 2,
  });
}

/** The slice of a `useQueries` result the folding actually reads. */
interface FiQueryState {
  status: string;
  isSuccess: boolean;
  isError: boolean;
  error: unknown;
  data?: FiBlob & { raw?: unknown[] | null };
  dataUpdatedAt: number;
}

export interface AaPortfolio {
  consents: ConsentRecord[];
  blobsById: Record<string, FiBlob | undefined>;
  positions: ClassPosition[];
  trouble: ConsentTrouble;
  /** Classes with at least one consent, for the "N of 5" chip. */
  connectedClassCount: number;
  hasConnections: boolean;
  isLoading: boolean;
  isError: boolean;
  error: AaError | null;
  refetch: () => void;
}

/**
 * The Import page's whole account picture: the consent list, each consent's FI
 * blob, and the five folded rows. Consents that fail are recorded in the
 * trouble store so a failed fetch never renders as an empty portfolio.
 */
export function useAaPortfolio(): AaPortfolio {
  const queryClient = useQueryClient();
  const consentsQuery = useConsentsQuery();
  const consents = useMemo(
    () => consentsQuery.data ?? [],
    [consentsQuery.data],
  );

  const dead = useAaTroubleStore((s) => s.dead);
  const failed = useAaTroubleStore((s) => s.failed);
  const markDead = useAaTroubleStore((s) => s.markDead);
  const markFailed = useAaTroubleStore((s) => s.markFailed);
  const clearTrouble = useAaTroubleStore((s) => s.clearTrouble);

  const fiQueries: FiQueryState[] = useQueries({
    queries: consents.map((consent) => ({
      queryKey: aaFiDataKey(consent.consentID),
      queryFn: () => getFiData(consent.consentID, { includeRaw: true }),
      staleTime: 5 * 60_000,
      retry: (failureCount: number, error: unknown) =>
        (error as AaError)?.kind === "transient" && failureCount < 2,
    })),
  });

  // `useQueries` hands back a fresh array every render, so the effects below
  // key off compact signatures of what actually changed.
  const outcomeSignature = fiQueries
    .map((q) => `${q.status}:${(q.error as AaError)?.kind ?? ""}`)
    .join("|");
  const dataSignature = fiQueries.map((q) => q.dataUpdatedAt).join("|");

  // Record each consent's outcome so the row ladder can tell "still syncing"
  // from "gave up" from "consent is gone" — never from "you own nothing".
  useEffect(() => {
    consents.forEach((consent, i) => {
      const q = fiQueries[i];
      if (!q) return;
      if (q.isSuccess) {
        clearTrouble(consent.consentID);
        return;
      }
      if (!q.isError) return;
      const kind = (q.error as AaError)?.kind;
      if (kind === "consent-dead") markDead(consent.consentID);
      else if (kind === "data-missing") markFailed(consent.consentID);
      // A transient failure leaves the row "syncing" — React Query retries.
    });
    // `fiQueries` is intentionally absent: `outcomeSignature` is what changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consents, outcomeSignature, clearTrouble, markDead, markFailed]);

  const blobsById = useMemo(() => {
    const map: Record<string, FiBlob | undefined> = {};
    consents.forEach((consent, i) => {
      const data = fiQueries[i]?.data;
      if (data) map[consent.consentID] = data;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consents, dataSignature]);

  const trouble = useMemo<ConsentTrouble>(
    () => ({ dead, failed }),
    [dead, failed],
  );

  const positions = useMemo(
    () => buildPositions(consents, blobsById, trouble),
    [consents, blobsById, trouble],
  );

  useAutoRefreshMissingData(consents, fiQueries, queryClient);

  return {
    consents,
    blobsById,
    positions,
    trouble,
    connectedClassCount: positions.filter((p) => p.consents.length > 0).length,
    hasConnections: consents.length > 0,
    isLoading: consentsQuery.isLoading,
    isError: consentsQuery.isError,
    error: (consentsQuery.error as AaError) ?? null,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: AA_CONSENTS_KEY });
    },
  };
}

/**
 * One-shot auto-refresh for a consent whose data is missing — never periodic.
 *
 * Mirrors mobile's `_recoverMissingImpl`: a `data-missing` consent gets exactly
 * one `refresh` + poll per consent per session, claimed through the trouble
 * store so a second render can't fire it again.
 */
function useAutoRefreshMissingData(
  consents: ConsentRecord[],
  fiQueries: { isError: boolean; error: unknown }[],
  queryClient: QueryClient,
) {
  const markAutoTriggered = useAaTroubleStore((s) => s.markAutoTriggered);
  const running = useRef(new Set<string>());

  const missing = consents
    .filter((_, i) => (fiQueries[i]?.error as AaError)?.kind === "data-missing")
    .map((c) => c.consentID)
    .join("|");

  useEffect(() => {
    if (!missing) return;
    for (const consentID of missing.split("|")) {
      if (running.current.has(consentID)) continue;
      if (!markAutoTriggered(consentID)) continue;
      running.current.add(consentID);

      void (async () => {
        try {
          await refreshConsent(consentID);
          const blob = await fetchWithRetry(consentID, POLL.adopt);
          queryClient.setQueryData(aaFiDataKey(consentID), blob);
        } catch {
          // Best effort — the per-row Sync action remains the fallback.
        } finally {
          running.current.delete(consentID);
        }
      })();
    }
  }, [missing, markAutoTriggered, queryClient]);
}
