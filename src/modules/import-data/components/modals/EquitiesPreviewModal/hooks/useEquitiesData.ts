/**
 * Hook for fetching and transforming equities data
 */

"use client";
import { useMemo } from "react";
import { useFiData } from "@/modules/import-data/hooks/useFiData";
import {
  EquityHolding,
  EquityHoldingWithQuantity,
  EquitiesFiDataResponse,
} from "@/modules/import-data/types/equities";
import {
  extractEquitiesFromFiData,
  transformEquitiesToFormData,
} from "../utils/equities-transformer";

/**
 * Hook for fetching and transforming equities data
 * Handles data fetching via useFiData and transforms to form-ready format
 *
 * @param consentID - The consent ID to fetch data for
 * @param isDataReady - Whether the data is ready to be fetched
 * @returns Equities, form default values, and loading state
 */
export function useEquitiesData(
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

  // Cast to equity-specific type
  const equitiesData = fiData as EquitiesFiDataResponse | undefined;

  // Extract equities from FI data (memoized)
  const equities = useMemo(
    () => extractEquitiesFromFiData(equitiesData),
    [equitiesData],
  );

  // Transform to form data with quantity field (memoized)
  const formDefaultValues = useMemo(
    () => transformEquitiesToFormData(equities),
    [equities],
  );

  return {
    /** Raw equity holdings */
    equities,
    /** Equities transformed for form with quantity field */
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
    /** Raw FI data response (equity-specific type) */
    fiData: equitiesData,
  };
}

export type UseEquitiesDataReturn = {
  equities: EquityHolding[];
  formDefaultValues: EquityHoldingWithQuantity[];
  isLoading: boolean;
  fiData: EquitiesFiDataResponse | undefined;
};
