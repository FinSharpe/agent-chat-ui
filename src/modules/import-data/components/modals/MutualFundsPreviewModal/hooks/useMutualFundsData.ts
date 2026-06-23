/**
 * Hook for fetching and transforming mutual funds data
 */

"use client";
import { useMemo } from "react";
import { useFiData } from "@/modules/import-data/hooks/useFiData";
import {
  MutualFundHolding,
  MutualFundHoldingWithQuantity,
  MutualFundsFiDataResponse,
} from "@/modules/import-data/types/mutual-funds";
import {
  extractMutualFundsFromFiData,
  transformMutualFundsToFormData,
} from "../utils/mutual-funds-transformer";

/**
 * Hook for fetching and transforming mutual funds data
 * Handles data fetching via useFiData and transforms to form-ready format
 *
 * @param consentID - The consent ID to fetch data for
 * @param isDataReady - Whether the data is ready to be fetched
 * @returns Mutual funds, form default values, and loading state
 */
export function useMutualFundsData(
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

  // Cast to mutual fund-specific type
  const mutualFundsData = fiData as MutualFundsFiDataResponse | undefined;

  // Extract mutual funds from FI data (memoized)
  const mutualFunds = useMemo(
    () => extractMutualFundsFromFiData(mutualFundsData),
    [mutualFundsData],
  );

  // Transform to form data with quantity field (memoized)
  const formDefaultValues = useMemo(
    () => transformMutualFundsToFormData(mutualFunds),
    [mutualFunds],
  );

  return {
    /** Raw mutual fund holdings */
    mutualFunds,
    /** Mutual funds transformed for form with quantity field */
    formDefaultValues,
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
    /** Raw FI data response (mutual fund-specific type) */
    fiData: mutualFundsData,
  };
}

export type UseMutualFundsDataReturn = {
  mutualFunds: MutualFundHolding[];
  formDefaultValues: MutualFundHoldingWithQuantity[];
  isLoading: boolean;
  fiData: MutualFundsFiDataResponse | undefined;
};
