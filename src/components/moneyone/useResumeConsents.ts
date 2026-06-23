"use client";
import {
  getAllFiData,
  getPendingConsentRedirectUrl,
  listConsents,
  ListedConsent,
  requestFiData,
  revokeConsent,
} from "@/lib/moneyone/moneyone.actions";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import {
  deleteConsent,
  getUserId,
  saveConsent,
  updateConsent,
} from "@/lib/moneyone/moneyone.storage";
import {
  classifyFiDataError,
  isConsentInvalidError,
} from "@/lib/moneyone/moneyone.utils";
import { FI_DATA_QUERY_KEY } from "@/modules/import-data/hooks/useFiData";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState } from "nuqs";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const RESUME_POLL_RETRIES = 10; // ~30s with 3s delays
const RESUME_POLL_DELAY_MS = 3000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch the user's existing ACTIVE consents for a consent type, keyed by mobile.
 */
export function useListConsentsMut(consentType: ConsentType) {
  return useMutation({
    mutationFn: async (mobileNo: string): Promise<ListedConsent[]> => {
      const result = await listConsents(mobileNo, consentType);
      if ("error" in result) throw new Error(result.error);
      return result;
    },
  });
}

/**
 * "Continue" an existing ACTIVE consent: hydrate it into localStorage and make
 * sure it actually has data before marking the card Connected.
 *
 * The consent is saved as NOT-ready first, so a failure leaves the card on
 * "Connect" rather than a broken "Connected". We try the fast path (data already
 * cached by the periodic fetch); if FinPro has none, we trigger a fresh fetch
 * and poll. Terminal errors (e.g. "no accounts found" from /fi/request) surface
 * to the caller instead of being swallowed.
 */
export function useResumeConsentMut(
  consentType: ConsentType,
  mobileNo: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listed: ListedConsent) => {
      const consentID = listed.consentID;
      if (!consentID) throw new Error("This consent has no ID to resume.");

      // Only persist the consent once data is confirmed, so a failed resume
      // leaves no half-connected record behind.
      const markReady = (data: unknown) => {
        saveConsent({
          consentID,
          consentCreationData:
            listed.consentCreationData || new Date().toISOString(),
          consentExpiry:
            listed.consentExpiry ||
            new Date(Date.now() + ONE_YEAR_MS).toISOString(),
          userId: getUserId(),
          isDataReady: true,
          isExpired: false,
          type: consentType,
          name: mobileNo,
          mobileNo,
        });
        queryClient.setQueryData([FI_DATA_QUERY_KEY, consentID], data);
      };

      // Fast path: data already present.
      const first = await getAllFiData(consentID);
      if (!("error" in first)) {
        markReady(first);
        return;
      }
      if (classifyFiDataError(first.errorCode, first.error) === "consent-dead") {
        updateConsent(consentID, { isExpired: true });
        throw new Error(first.error);
      }

      // No data yet — trigger a fresh AA fetch. A terminal error here
      // (e.g. "no accounts found") is surfaced, not swallowed.
      const req = await requestFiData(consentID);
      if ("error" in req) {
        if (isConsentInvalidError(req.errorCode, req.error)) {
          updateConsent(consentID, { isExpired: true });
        }
        throw new Error(req.error);
      }

      // Poll until the data lands.
      for (let i = 0; i < RESUME_POLL_RETRIES; i++) {
        await sleep(RESUME_POLL_DELAY_MS);
        const data = await getAllFiData(consentID);
        if (!("error" in data)) {
          markReady(data);
          return;
        }
        if (classifyFiDataError(data.errorCode, data.error) === "consent-dead") {
          updateConsent(consentID, { isExpired: true });
          throw new Error(data.error);
        }
      }

      throw new Error(
        "Timed out fetching data for this connection. Try Refresh on the card in a moment.",
      );
    },
  });
}

/**
 * "Finish setup" for a PENDING consent — IN PLACE, completing the SAME consent
 * (no duplicate). Stores a pending-consent record (so the return handler can
 * complete it), regenerates the AA redirect URL from the existing handle (with
 * PAN + fipID for equity/MF discovery), and sends the user back to the AA.
 */
export function useResumePendingMut(
  consentType: ConsentType,
  mobileNo: string,
  pan: string,
) {
  const [threadId] = useQueryState("threadId");

  return useMutation({
    mutationFn: async (listed: ListedConsent) => {
      if (!listed.consentHandle) {
        throw new Error("This pending consent can't be resumed.");
      }

      const userId = getUserId();

      // Use the consent's ORIGINAL accountID so the return handler
      // (/moneyone/[slug]) can resolve it via getConsentList.
      const redirectPath = threadId
        ? `/moneyone/${consentType}~${listed.accountID}~${threadId}`
        : `/moneyone/${consentType}~${listed.accountID}`;
      const redirectUrl = new URL(
        redirectPath,
        window.location.origin,
      ).toString();

      localStorage.setItem(
        `moneyone:pending-consent:${listed.consentHandle}`,
        JSON.stringify({
          consentHandle: listed.consentHandle,
          mobileNo,
          consentType,
          userId,
          consentCreationData:
            listed.consentCreationData || new Date().toISOString(),
          consentExpiry:
            listed.consentExpiry ||
            new Date(Date.now() + ONE_YEAR_MS).toISOString(),
          name: mobileNo,
        }),
      );

      const result = await getPendingConsentRedirectUrl(
        listed.consentHandle,
        redirectUrl,
        consentType,
        pan,
      );
      if ("error" in result) throw new Error(result.error);

      // Leave the app for the AA approval page.
      window.location.href = result.url;
    },
  });
}

/**
 * Revoke a listed consent on MoneyOne and clean up any local copy. Only usable
 * for consents that have a consentID (PENDING ones don't and can't be revoked).
 * "Already revoked / doesn't exist" is treated as success.
 */
export function useRevokeListedConsentMut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (consentID: string) => {
      const result = await revokeConsent(consentID);
      if ("error" in result && !result.alreadyGone) {
        throw new Error(result.error);
      }
      deleteConsent(consentID);
      queryClient.removeQueries({ queryKey: [FI_DATA_QUERY_KEY, consentID] });
    },
  });
}
