"use client";
import { useMemo } from "react";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { useFiData } from "@/modules/import-data/hooks/useFiData";
import {
  extractCurrentValueFromFiData,
  extractHoldingsFromFiData,
  transformHoldingsToFormData,
} from "../utils/holdings-transformer";

/**
 * Hook for fetching and transforming holdings data for any editable ConsentType.
 * Wraps useFiData and shapes the result for the holdings form, surfacing the
 * error classification (for FiDataErrorState) and the summed current value (ETF).
 *
 * @param consentID - The consent ID to fetch data for
 * @param consentType - Asset type (drives the quantity-field mapping)
 * @param isDataReady - Whether the data is ready to be fetched
 */
export function useHoldingsData(
  consentID: string | null | undefined,
  consentType: ConsentType,
  isDataReady: boolean,
) {
  const {
    data: fiData,
    isLoading,
    isError,
    isConsentError,
    errorKind,
    error,
  } = useFiData(consentID, !!isDataReady);

  // Extract holdings from FI data (memoized)
  const holdings = useMemo(
    () => extractHoldingsFromFiData(fiData),
    [fiData],
  );

  // Transform to form data with quantity field (memoized)
  const formDefaultValues = useMemo(
    () => transformHoldingsToFormData(holdings, consentType),
    [holdings, consentType],
  );

  // Total current value across accounts (used by ETF's summary card)
  const currentValue = useMemo(
    () => extractCurrentValueFromFiData(fiData),
    [fiData],
  );

  return {
    /** Raw holdings data */
    holdings,
    /** Holdings transformed for form with quantity field */
    formDefaultValues,
    /** Whether data is currently loading */
    isLoading,
    /** Raw FI data response */
    fiData,
    /** Whether the FI-data fetch failed */
    isError,
    /** Whether the failure is due to an expired/revoked consent */
    isConsentError,
    /** How to handle the failure: consent-dead | data-missing | transient */
    errorKind,
    /** Error message from the failed fetch, if any */
    errorMessage: error?.message,
    /** Total current value across accounts */
    currentValue,
  };
}
