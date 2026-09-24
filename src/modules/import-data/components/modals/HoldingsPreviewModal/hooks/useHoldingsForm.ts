"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { usePendingRemovals } from "./usePendingRemovals";

/**
 * Form data type for holdings
 */
export type HoldingFormData = {
  holdings: HoldingWithQuantity[];
};

/** A reported holding taken out of the ledger, kept on screen with its Undo. */
export type RemovedHolding = {
  id: string;
  holding: HoldingWithQuantity;
  /** Its place in the reported book; the row is drawn and restored there. */
  origin: number;
};

/** Identity of a holding apart from the units the user can edit (and the
 * `id` a field-array row carries). */
function holdingKey(holding: HoldingWithQuantity) {
  const {
    quantity: _q,
    id: _id,
    ...rest
  } = holding as HoldingWithQuantity & {
    id?: string;
  };
  return JSON.stringify(rest);
}

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
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { isDirty },
  } = useForm<HoldingFormData>({
    defaultValues: {
      holdings: defaultValues,
    },
  });

  const { fields, append, insert, remove } = useFieldArray({
    control,
    name: "holdings",
  });

  // The book the form was filled from. Origins are measured against it, not
  // against whatever the query holds later: a refetch that reprices a
  // holding must not turn a reported row into an "added" one.
  const [filled, setFilled] = useState<HoldingWithQuantity[] | null>(
    defaultValues.length > 0 ? defaultValues : null,
  );
  const book = filled ?? defaultValues;

  // Fill the form once, when the holdings land. Only once: an edit that
  // removes every holding must not bring the book back on its own.
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current || defaultValues.length === 0) return;
    loaded.current = true;
    setFilled((prev) => prev ?? defaultValues);
    if (fields.length === 0) reset({ holdings: defaultValues });
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

  const removals = usePendingRemovals(
    fields.map((f) => f.id),
    remove,
  );
  const { schedule, clear: clearRemovals } = removals;

  // Holdings the FIP reported. Removing one takes it out of the ledger at
  // once (totals, analysis, import) but keeps it on screen with an Undo that
  // does not run out; a holding added from search gets the timed Undo.
  // Reported holdings stay in the reported order (removals don't reorder,
  // restores go back to their place) ahead of anything added from search.
  const origins = useMemo(() => {
    const map = new Map<string, number>();
    book.forEach((h, i) => {
      const key = holdingKey(h);
      if (!map.has(key)) map.set(key, i);
    });
    return map;
  }, [book]);
  /** A holding's place in the reported book; undefined for an added one. */
  const originOf = useCallback(
    (holding: HoldingWithQuantity | undefined) =>
      holding ? origins.get(holdingKey(holding)) : undefined,
    [origins],
  );
  const [removed, setRemoved] = useState<RemovedHolding[]>([]);

  const handleRemoveHolding = useCallback(
    (index: number) => {
      const field = fields[index];
      if (!field) return;
      const holding = getValues(`holdings.${index}`);
      const origin = originOf(holding);
      if (origin !== undefined) {
        remove(index);
        setRemoved((prev) => [...prev, { id: field.id, holding, origin }]);
      } else {
        schedule(field.id);
      }
    },
    [fields, getValues, originOf, remove, schedule],
  );

  /** Put a removed reported holding back where it was. */
  const handleRestoreHolding = useCallback(
    (id: string) => {
      const entry = removed.find((r) => r.id === id);
      if (!entry) return;
      setRemoved((prev) => prev.filter((r) => r.id !== id));
      const at = getValues("holdings").filter(
        (h) => (originOf(h) ?? Infinity) < entry.origin,
      ).length;
      insert(at, entry.holding, { shouldFocus: false });
    },
    [removed, getValues, insert, originOf],
  );

  /** The submitted holdings, less the rows still waiting to be removed. */
  const keptHoldings = useCallback(
    (holdings: HoldingWithQuantity[]) =>
      holdings.filter((_, i) => !removals.pending.has(fields[i]?.id)),
    [fields, removals.pending],
  );

  // Whether the ledger differs from the book the form was filled from
  // (react-hook-form's dirty state is measured against that same book).
  const isEdited = isDirty || removals.pending.size > 0;

  /** Put the ledger back to the book the FIP reported. */
  const resetHoldings = useCallback(() => {
    clearRemovals();
    setRemoved([]);
    setFilled(defaultValues);
    reset({ holdings: defaultValues });
  }, [clearRemovals, reset, defaultValues]);

  return {
    /** Form control for react-hook-form */
    control,
    /** Submit handler */
    handleSubmit,
    /** Field array items */
    fields,
    /** Add search result as new holding */
    handleAddSearchResult,
    /** Remove a holding, with an Undo in its row */
    handleRemoveHolding,
    /** Reported holdings taken out, still shown with their Undo */
    removedHoldings: removed,
    /** Put a removed reported holding back */
    handleRestoreHolding,
    /** A holding's place in the reported book (undefined if added) */
    originOf,
    /** Field ids waiting out their Undo */
    pendingRemovals: removals.pending,
    /** Keep a row marked for removal */
    handleUndoRemove: removals.undo,
    /** Submitted holdings without the rows marked for removal */
    keptHoldings,
    /** The ledger differs from the reported book */
    isEdited,
    /** Restore the reported book */
    resetHoldings,
    /** Reset form to default values */
    reset,
    /** Get current form values */
    getValues,
  };
}
