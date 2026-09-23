"use client";
import { useCallback, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import {
  StockSearchResponse,
  MutualFundSearchResponse,
} from "@/types/search-api.types";
import {
  HoldingWithQuantity,
  transformSearchResultToHolding,
} from "../utils/holdings-transformer";

/**
 * Form data type for holdings
 */
export type HoldingFormData = {
  holdings: HoldingWithQuantity[];
};

/**
 * Hook for managing holdings form state and operations
 * Encapsulates react-hook-form and field array logic
 *
 * @param defaultValues - Initial form values
 * @param consentType - Type of consent (for search result transformation)
 * @returns Form control, fields, and operations
 */
export function useHoldingsForm(
  defaultValues: HoldingWithQuantity[],
  consentType: ConsentType,
) {
  const { control, handleSubmit, reset, getValues } = useForm<HoldingFormData>({
    defaultValues: {
      holdings: defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "holdings",
  });

  // Reset form when default values change (data loads)
  useEffect(() => {
    if (defaultValues.length > 0 && fields.length === 0) {
      reset({ holdings: defaultValues });
    }
  }, [defaultValues, fields.length, reset]);

  /**
   * Add a holding from search result
   */
  const handleAddSearchResult = useCallback(
    (
      result:
        | StockSearchResponse["results"][0]
        | MutualFundSearchResponse["results"][0],
    ) => {
      const newHolding = transformSearchResultToHolding(result, consentType);
      append(newHolding);
    },
    [append, consentType],
  );

  /**
   * Remove a holding by index
   */
  const handleRemoveHolding = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove],
  );

  return {
    /** Form control for react-hook-form */
    control,
    /** Submit handler */
    handleSubmit,
    /** Field array items */
    fields,
    /** Add search result as new holding */
    handleAddSearchResult,
    /** Remove holding by index */
    handleRemoveHolding,
    /** Reset form to default values */
    reset,
    /** Get current form values */
    getValues,
  };
}
