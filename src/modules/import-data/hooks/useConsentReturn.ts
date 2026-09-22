"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AaError, refreshConsent, resolveConsent } from "../api/aa-client";
import { isAaConsentType } from "../types/aa";
import { clearPendingJourney, readPendingJourney } from "../utils/aa-pending";
import {
  AA_CONSENTS_KEY,
  POLL,
  aaFiDataKey,
  fetchWithRetry,
} from "./useAaPortfolio";

/** What the fetching modal renders. */
export type ReturnPhase =
  | "idle"
  | "resolving"
  | "fetching"
  | "linked"
  | "rejected"
  | "failed";

export interface ConsentReturnState {
  phase: ReturnPhase;
  /** 1 consent approved · 2 contacting providers · 3 preparing portfolio. */
  step: 1 | 2 | 3;
  error: string | null;
}

/** Strip the AA return params without adding a history entry. */
function stripReturnParams() {
  const url = new URL(window.location.href);
  for (const key of ["ecres", "resdate", "fi", "type", "accountID"]) {
    url.searchParams.delete(key);
  }
  history.replaceState(null, "", url.toString());
}

/**
 * Completes a consent on return from OneMoney.
 *
 * The backend registers a single redirect with MoneyOne —
 * `{origin}/moneyone/{TYPE}~{accountID}~mobile` (finsharpe-agents
 * `src/api/aa.py::_redirect_url_for`) — whose origin is this very web app.
 * `/moneyone/[slug]` forwards MoneyOne's raw `ecres`/`resdate`/`fi` plus the
 * slug's `type` and `accountID` to `/app/consent-return`, which hands a *web*
 * journey on to `/import` with the same params. This hook is the last leg:
 * forward them untouched to `resolve`, then poll for the first FI data.
 */
export function useConsentReturn() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [state, setState] = useState<ConsentReturnState>({
    phase: "idle",
    step: 1,
    error: null,
  });
  const handledRef = useRef<string | null>(null);
  // Unmount, not a dependency change, ends a journey: stripping the return
  // params re-renders with `ecres` gone, and the journey must outlive that.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const ecres = searchParams.get("ecres");
  const typeParam = searchParams.get("type");
  const accountID = searchParams.get("accountID");
  const resdate = searchParams.get("resdate");
  const fi = searchParams.get("fi");

  const dismiss = useCallback(
    () => setState((s) => ({ ...s, phase: "idle" })),
    [],
  );

  useEffect(() => {
    if (!ecres) return;

    const pending = readPendingJourney();
    // The stored journey's type wins; the URL is the fallback (mobile does the
    // same — the slug can only ever echo what we asked for).
    const type = pending?.type ?? (isAaConsentType(typeParam) ? typeParam : null);
    if (!type) return;

    const journeyKey = `${ecres}:${type}`;
    if (handledRef.current === journeyKey) return;
    handledRef.current = journeyKey;

    void (async () => {
      setState({ phase: "resolving", step: 1, error: null });
      try {
        const result = await resolveConsent({
          type,
          ecres,
          resdate,
          fi,
          accountID: accountID ?? pending?.accountID ?? null,
        });

        if (!mountedRef.current) return;

        if (result.status === "rejected") {
          clearPendingJourney();
          stripReturnParams();
          setState({
            phase: "rejected",
            step: 1,
            error:
              result.message ??
              "The Account Aggregator reported that the request was rejected.",
          });
          return;
        }

        if (result.status === "pending") {
          // Approval isn't finished — keep the consent marker so the user can
          // come back to it, and say so plainly rather than failing.
          stripReturnParams();
          setState({ phase: "idle", step: 1, error: null });
          toast.message(
            "Approval not finished yet. Complete it on the OneMoney page.",
          );
          return;
        }

        if (result.status !== "linked" || !result.consent) {
          clearPendingJourney();
          stripReturnParams();
          setState({
            phase: "failed",
            step: 1,
            error:
              result.message ??
              "The Account Aggregator reported that the request was rejected or timed out.",
          });
          return;
        }

        const consentID = result.consent.consentID;
        clearPendingJourney();
        stripReturnParams();
        // The consent exists server-side even before its data lands, so show
        // the row immediately as "Syncing…" rather than not at all.
        queryClient.invalidateQueries({ queryKey: AA_CONSENTS_KEY });
        setState({ phase: "fetching", step: 2, error: null });

        try {
          const blob = await fetchWithRetry(consentID, POLL.adopt);
          queryClient.setQueryData(aaFiDataKey(consentID), blob);
          if (!mountedRef.current) return;
          setState({ phase: "linked", step: 3, error: null });
          toast.success("Account connected. Holdings are in.");
        } catch (error) {
          if (!mountedRef.current) return;
          // Linked but the providers haven't served data yet — the row shows
          // "Syncing" and Sync retries. Not a failed consent.
          setState({
            phase: "linked",
            step: 3,
            error: (error as AaError)?.message ?? null,
          });
        }

        // FI data arrives per FIP: the first successful fetch after approval
        // often carries only the fastest provider's data. One quiet follow-up
        // sweep picks up late FIPs without the user hunting for Sync.
        void lateFipSweep(consentID, queryClient);
      } catch (error) {
        if (!mountedRef.current) return;
        clearPendingJourney();
        stripReturnParams();
        setState({
          phase: "failed",
          step: 1,
          error:
            (error as AaError)?.message ??
            "The Account Aggregator could not be reached.",
        });
      }
    })();
  }, [ecres, resdate, fi, typeParam, accountID, queryClient]);

  return { ...state, dismiss };
}

/** One-shot, two minutes after linking. Best effort; Sync is the fallback. */
async function lateFipSweep(
  consentID: string,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await new Promise((resolve) => setTimeout(resolve, 2 * 60_000));
  try {
    await refreshConsent(consentID);
    const blob = await fetchWithRetry(consentID, POLL.sweep);
    queryClient.setQueryData(aaFiDataKey(consentID), blob);
  } catch {
    // Silent by design — the per-row Sync action remains the fallback.
  }
}
