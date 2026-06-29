/**
 * Hook for fetching and transforming SIP data
 */

"use client";
import { useMemo } from "react";
import { useFiData } from "@/modules/import-data/hooks/useFiData";
import { SIPFiDataResponse } from "@/modules/import-data/types/sip";
import { transformSipAccountsToDisplayData } from "../utils/sip-transformer";
import { computeSipHygiene } from "../utils/sip-hygiene";
import { computeSipAnalytics } from "../utils/sip-analytics";

/**
 * Hook for fetching and transforming SIP data
 * Handles data fetching via useFiData and transforms to display-ready format
 *
 * @param consentID - The consent ID to fetch data for
 * @param isDataReady - Whether the data is ready to be fetched
 * @returns SIP display data, loading state, and raw FI data
 */
export function useSipData(
  consentID: string | null | undefined,
  isDataReady: boolean,
) {
  // Fetch FI data - always enabled if consentID exists (for cache hydration)
  const {
    data: fiData,
    isLoading,
    isError,
    isConsentError,
    errorKind,
    error,
  } = useFiData(consentID, !!isDataReady);

  // Cast to SIP-specific type
  const sipData = fiData as SIPFiDataResponse | undefined;

  // Transform to display data (memoized)
  const displayData = useMemo(
    () => transformSipAccountsToDisplayData(sipData),
    [sipData],
  );

  // Registry/hygiene facts from the Profile block (available today).
  const hygiene = useMemo(() => computeSipHygiene(sipData), [sipData]);

  // Performance analytics — null until a Summary/Transactions block arrives.
  const analytics = useMemo(() => computeSipAnalytics(sipData), [sipData]);

  return {
    /** SIP accounts transformed for display */
    displayData,
    /** Registry & account-hygiene facts (KYC, nominee gap, fund-house spread) */
    hygiene,
    /** Performance analytics, or null while gated on Summary/Transactions */
    analytics,
    /** Whether real performance analytics are available to render */
    hasPerformanceData: analytics !== null,
    /** Whether data is currently loading */
    isLoading,
    /** Whether the FI-data fetch failed */
    isError,
    /** Whether the failure is due to an expired/revoked consent */
    isConsentError,
    /** How to handle the failure: consent-dead | data-missing | transient */
    errorKind,
    /** Error message from the failed fetch, if any */
    errorMessage: error?.message,
    /** Raw FI data response (SIP-specific type) */
    fiData: sipData,
  };
}
