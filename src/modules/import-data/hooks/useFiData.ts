"use client";
import { getAllFiData, requestFiData } from "@/lib/moneyone/moneyone.actions";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import {
  completePendingConsent,
  updateConsent,
} from "@/lib/moneyone/moneyone.storage";
import {
  classifyFiDataError,
  isConsentInvalidError,
} from "@/lib/moneyone/moneyone.utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Shared constants for FI data queries
export const FI_DATA_QUERY_KEY = "fi-data";

/** Error thrown by FI-data queries, carrying the MoneyOne error code. */
export type FiDataError = Error & { errorCode?: string };
// Cache settings (gcTime: 7 days, staleTime: Infinity) are configured in QueryProvider via setQueryDefaults

/**
 * Hook for completing consent flow and fetching FI data
 * Handles the full consent completion workflow including:
 * - Completing pending consent with real consentID
 * - Fetching FI data from MoneyOne API
 * - Marking consent as ready
 * - Cleaning up URL parameters
 * - Managing modal state for fetch status display
 *
 * @returns Object with fetchStatus, modal state (modalOpen, handleClose, handleOpen), and query data
 */
export function useFiDataConsentFlow() {
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const consentCompletedRef = useRef<string | null>(null);

  const consentID = searchParams.get("consentID");
  const consentType = searchParams.get("consentType");

  const isEnabled =
    !!consentID &&
    !!consentType &&
    Object.values(ConsentType).includes(consentType as ConsentType);

  // Complete pending consent once before the query runs (not inside queryFn)
  useEffect(() => {
    if (
      isEnabled &&
      consentID &&
      consentType &&
      consentCompletedRef.current !== consentID
    ) {
      consentCompletedRef.current = consentID;
      const mobileNo = searchParams.get("mobileNo");
      const consentCreationData = searchParams.get("consentCreationData");
      completePendingConsent(
        consentID,
        consentType as ConsentType,
        mobileNo,
        consentCreationData,
      );
    }
  }, [isEnabled, consentID, consentType, searchParams]);

  const query = useQuery({
    queryKey: consentID ? [FI_DATA_QUERY_KEY, consentID] : ["fi-data-disabled"],
    queryFn: async () => {
      setModalOpen(true);

      if (!consentID || !consentType) {
        throw new Error("Invalid consent ID or consent type");
      }

      const data = await getAllFiData(consentID, 3000);

      if ("error" in data) {
        const err = new Error(data.error) as FiDataError;
        err.errorCode = data.errorCode;
        throw err;
      }

      // Mark data as ready after successful fetch (clear any stale expiry flag)
      updateConsent(consentID, { isDataReady: true, isExpired: false });

      // Remove search params from url
      const url = new URL(window.location.href);
      url.searchParams.delete("consentID");
      url.searchParams.delete("consentType");
      url.searchParams.delete("mobileNo");
      url.searchParams.delete("consentCreationData");
      history.pushState(null, "", url.toString());

      setTimeout(() => setModalOpen(false), 1500);

      return data;
    },
    enabled: isEnabled,
    retry: true,
    retryDelay: 3000,
    // gcTime (7 days), staleTime (Infinity), and refetchOnWindowFocus inherited from QueryProvider setQueryDefaults
  });

  // Derive fetch status from query state
  const fetchStatus: "fetching" | "success" | "error" = query.isError
    ? "error"
    : query.isLoading || !query.data
      ? "fetching"
      : "success";

  return {
    ...query,
    fetchStatus,
    modalOpen,
    handleClose: () => setModalOpen(false),
    handleOpen: () => setModalOpen(true),
  };
}

/**
 * Hook for accessing FI data from cache or API
 * Simple data fetching hook that shares cache with useFiDataConsentFlow.
 * Use this when you just need to access FI data without consent flow logic.
 *
 * @param consentID - The consent ID to fetch FI data for
 * @param enabled - Whether the query should run
 * @returns Query result with FI data
 */
export function useFiData(
  consentID: string | null | undefined,
  enabled: boolean = true,
) {
  const query = useQuery({
    queryKey: consentID ? [FI_DATA_QUERY_KEY, consentID] : ["fi-data-disabled"],
    queryFn: async () => {
      if (!consentID) {
        throw new Error("Invalid consent ID");
      }

      const data = await getAllFiData(consentID);

      if ("error" in data) {
        const err = new Error(data.error) as FiDataError;
        err.errorCode = data.errorCode;
        throw err;
      }

      return data;
    },
    enabled: enabled && !!consentID,
    // gcTime and staleTime inherited from QueryProvider defaults for ['fi-data'] queries
  });

  // Classify any failure: dead consent vs. missing-data (re-fetchable) vs.
  // transient. Only a dead consent flips the card into the "Expired" state.
  const error = query.error as FiDataError | null;
  const errorKind = query.isError
    ? classifyFiDataError(error?.errorCode, error?.message)
    : null;
  const isConsentError = errorKind === "consent-dead";

  // When the consent is dead, flip it to an "expired" state so the card can
  // offer Refresh/Delete instead of leaving a broken "Connected" card and a
  // silent empty preview modal. Missing-data does NOT expire the consent —
  // it's recoverable with a fresh fetch.
  useEffect(() => {
    if (isConsentError && consentID) {
      updateConsent(consentID, { isDataReady: false, isExpired: true });
    }
  }, [isConsentError, consentID]);

  return { ...query, errorKind, isConsentError };
}

/**
 * Hook for refreshing FI data for an existing consent
 * Handles the full refresh workflow including:
 * - Triggering FI data request via requestFiData API
 * - Polling getAllFiData until new data is available
 * - Updating React Query cache with fresh data
 * - All components using useFiData will automatically update
 *
 * @returns Mutation object with refresh functionality
 */
export function useRefreshFiData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (consentID: string) => {
      // Step 1: Trigger FI data request (non-async, just initiates fetch)
      const requestResult = await requestFiData(consentID);

      if ("error" in requestResult) {
        // A dead consent (expired/revoked) can't be refreshed — flag it so the
        // card surfaces Delete + re-consent rather than retrying in vain.
        if (isConsentInvalidError(requestResult.errorCode, requestResult.error)) {
          updateConsent(consentID, { isDataReady: false, isExpired: true });
        }
        throw new Error(requestResult.error);
      }

      // Clear the cache for this consent to ensure fresh data is fetched
      // This is critical because we have staleTime: Infinity (7-day cache)
      // Without clearing, even if new data is available, we'd serve stale cache
      queryClient.removeQueries({
        queryKey: [FI_DATA_QUERY_KEY, consentID],
      });
      console.log("Cleared FI data cache for consent:", consentID);

      // Step 2: Poll for new data with retries
      // Similar to useFiDataConsentFlow behavior
      const pollData = async (retryCount = 0): Promise<any> => {
        const maxRetries = 20; // ~60 seconds total with 3s delays

        if (retryCount >= maxRetries) {
          throw new Error(
            "Request timeout. The refresh is taking longer than expected. Please try again later.",
          );
        }

        // Wait before fetching (3 seconds like the consent flow)
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const data = await getAllFiData(consentID);

        if ("error" in data) {
          // Stop polling immediately if the consent itself is dead — retrying
          // won't help. Flag it for the Expired card state.
          if (isConsentInvalidError(data.errorCode, data.error)) {
            updateConsent(consentID, { isDataReady: false, isExpired: true });
            throw new Error(data.error);
          }
          // Otherwise it's just "data not ready yet" — keep polling.
          return pollData(retryCount + 1);
        }

        return data;
      };

      return pollData();
    },
    onSuccess: (data, consentID) => {
      // Update cache with new data - this automatically updates all components
      // using useFiData(consentID) across the app
      queryClient.setQueryData([FI_DATA_QUERY_KEY, consentID], data);

      // Update consent with fresh timestamp and ready state (clear expiry flag)
      updateConsent(consentID, {
        isDataReady: true,
        isExpired: false,
        consentCreationData: new Date().toISOString(),
      });
      console.log("Marked consent data as ready after refresh:", consentID);
    },
  });
}
