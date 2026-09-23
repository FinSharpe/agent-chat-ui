"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AaError, refreshConsent } from "../api/aa-client";
import { useAaTroubleStore } from "../store/useAaTroubleStore";
import type { FiDataResponse } from "@/modules/import-data/types/moneyone-raw";
import {
  POLL,
  aaFiDataKey,
  fetchWithRetry,
  useFiDataQuery,
} from "./useAaPortfolio";

/**
 * The analysis modals' view of one consent's FI data.
 *
 * Since T-11 this goes through the backend's `/api/aa/consents/{id}/fi-data`
 * rather than MoneyOne directly. The backend normalizes every figure the page
 * itself needs (values, counts, balances) — see `useAaPortfolio` — but it also
 * returns MoneyOne's per-account payloads under `?includeRaw=true`, and the
 * preview modals keep reading those because they show column-level detail the
 * normalized shapes don't carry (UCC, registrar, FATCA status, MICR, holder
 * profile). That raw block now arrives from our own backend, under the session
 * JWT; nothing in this app talks to MoneyOne any more.
 */
export type FiDataError = AaError;

/** Kept for call sites that only need the shape of a failure. */
export type FiDataErrorKind = AaError["kind"];

export function useFiData(
  consentID: string | null | undefined,
  enabled: boolean = true,
) {
  const query = useFiDataQuery(enabled ? consentID : null);
  const error = (query.error as AaError | null) ?? null;
  const errorKind = query.isError ? (error?.kind ?? "transient") : null;

  return {
    ...query,
    /** MoneyOne's per-account payloads, as the transformers have always seen them. */
    data: (query.data?.raw as FiDataResponse | undefined) ?? undefined,
    /** The server-normalized block, for anything that doesn't need raw detail. */
    normalized: query.data?.normalized,
    fetchedAt: query.data?.fetchedAt,
    errorKind,
    isConsentError: errorKind === "consent-dead",
  };
}

/**
 * Trigger a fresh AA pull for one consent, then poll until the data lands.
 *
 * A transient failure on the trigger deliberately falls through to the poll —
 * MoneyOne's pipeline often runs anyway. Only a dead consent aborts.
 */
export function useRefreshFiData() {
  const queryClient = useQueryClient();
  const markDead = useAaTroubleStore((s) => s.markDead);
  const clearTrouble = useAaTroubleStore((s) => s.clearTrouble);

  return useMutation({
    mutationFn: async (consentID: string) => {
      try {
        await refreshConsent(consentID);
      } catch (error) {
        if ((error as AaError)?.kind === "consent-dead") throw error;
      }
      return fetchWithRetry(consentID, POLL.manual);
    },
    onSuccess: (blob, consentID) => {
      clearTrouble(consentID);
      queryClient.setQueryData(aaFiDataKey(consentID), blob);
    },
    onError: (error, consentID) => {
      if ((error as AaError)?.kind === "consent-dead") markDead(consentID);
    },
  });
}
