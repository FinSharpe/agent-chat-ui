"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AaError, refreshConsent, revokeConsent } from "../api/aa-client";
import { useAaTroubleStore } from "../store/useAaTroubleStore";
import type { ConsentRecord } from "../types/aa";
import { CLASS_LABELS } from "../utils/aa-fold";
import {
  AA_CONSENTS_KEY,
  POLL,
  aaFiDataKey,
  fetchWithRetry,
} from "./useAaPortfolio";

/**
 * Manual per-row Sync. Triggers a fresh AA pull, then polls fi-data.
 *
 * A transient failure on the trigger falls through to the poll on purpose —
 * MoneyOne's pipeline often runs anyway. Only a dead consent aborts, because
 * no amount of polling will make it answer. (finsharpe-mobile
 * `PortfolioController.refreshConsent`.)
 */
export function useSyncConsent() {
  const queryClient = useQueryClient();
  const markDead = useAaTroubleStore((s) => s.markDead);
  const clearTrouble = useAaTroubleStore((s) => s.clearTrouble);

  return useMutation({
    mutationFn: async (consent: ConsentRecord) => {
      try {
        await refreshConsent(consent.consentID);
      } catch (error) {
        if ((error as AaError)?.kind === "consent-dead") throw error;
      }
      return fetchWithRetry(consent.consentID, POLL.manual);
    },
    onSuccess: (blob, consent) => {
      clearTrouble(consent.consentID);
      queryClient.setQueryData(aaFiDataKey(consent.consentID), blob);
      toast.success(`${CLASS_LABELS[consent.type]} refreshed.`);
    },
    onError: (error, consent) => {
      const label = CLASS_LABELS[consent.type].toLowerCase();
      if ((error as AaError)?.kind === "consent-dead") {
        markDead(consent.consentID);
        toast.error(
          `Your ${label} consent is no longer active. Renew it to reconnect.`,
        );
        return;
      }
      toast.error(`Could not refresh ${label}. Try again.`);
    },
  });
}

/**
 * Withdraw a consent at the Account Aggregator and drop its row. `alreadyGone`
 * is a success for the user's intent — the mandate has already stopped.
 */
export function useRevokeConsent() {
  const queryClient = useQueryClient();
  const forget = useAaTroubleStore((s) => s.forget);

  return useMutation({
    mutationFn: (consent: ConsentRecord) => revokeConsent(consent.consentID),
    onSuccess: (_result, consent) => {
      forget(consent.consentID);
      queryClient.removeQueries({ queryKey: aaFiDataKey(consent.consentID) });
      queryClient.invalidateQueries({ queryKey: AA_CONSENTS_KEY });
      toast.success(
        `Consent revoked. ${CLASS_LABELS[consent.type]} data removed.`,
      );
    },
    onError: () => {
      toast.error("Could not revoke the consent. Check your connection.");
    },
  });
}
