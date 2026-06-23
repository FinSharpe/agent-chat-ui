/**
 * Hook for fetching and transforming ETF data
 */

"use client";
import { useMemo } from "react";
import { useFiData } from "@/modules/import-data/hooks/useFiData";
import {
  ETFHolding,
  ETFHoldingWithQuantity,
  ETFFiDataResponse,
} from "@/modules/import-data/types/etf";
import {
  extractETFsFromFiData,
  transformETFsToFormData,
  extractCurrentValueFromFiData,
} from "../utils/etf-transformer";

/**
 * Hook for fetching and transforming ETF data
 * Handles data fetching via useFiData and transforms to form-ready format
 *
 * @param consentID - The consent ID to fetch data for
 * @param isDataReady - Whether the data is ready to be fetched
 * @returns ETFs, form default values, and loading state
 */
export function useEtfData(
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

  // Cast to ETF-specific type
  const etfData = fiData as ETFFiDataResponse | undefined;

  // Extract ETFs from FI data (memoized)
  const etfs = useMemo(
    () => extractETFsFromFiData(etfData),
    [etfData],
  );

  // Transform to form data with quantity field (memoized)
  const formDefaultValues = useMemo(
    () => transformETFsToFormData(etfs),
    [etfs],
  );

  // Extract total current value from all accounts (memoized)
  const currentValue = useMemo(
    () => extractCurrentValueFromFiData(etfData),
    [etfData],
  );

  return {
    /** Raw ETF holdings */
    etfs,
    /** ETFs transformed for form with quantity field */
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
    /** Raw FI data response (ETF-specific type) */
    fiData: etfData,
    /** Total current value of all ETF holdings */
    currentValue,
  };
}

export type UseEtfDataReturn = {
  etfs: ETFHolding[];
  formDefaultValues: ETFHoldingWithQuantity[];
  isLoading: boolean;
  fiData: ETFFiDataResponse | undefined;
  currentValue: string | null;
};
