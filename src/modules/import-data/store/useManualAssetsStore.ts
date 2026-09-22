"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FormValues } from "../components/forms/shared/form-schema";

/** Connected-account rows that are manual trackers rather than an AA link. */
export type ManualAssetCategory =
  | "fd"
  | "insurance"
  | "realestate"
  | "commodities"
  | "other";

export interface ManualAssetEntry {
  id: string;
  createdAt: number;
  /** Exactly what the add-asset form submitted. */
  data: FormValues;
}

interface ManualAssetsState {
  entries: Partial<Record<ManualAssetCategory, ManualAssetEntry[]>>;
  addEntry: (category: ManualAssetCategory, data: FormValues) => void;
  updateEntry: (
    category: ManualAssetCategory,
    id: string,
    data: FormValues,
  ) => void;
  removeEntry: (category: ManualAssetCategory, id: string) => void;
}

/**
 * The investments a user adds by hand (FDs, policies, property, commodities,
 * other). There is no backend for these yet, so — like the reference design —
 * they live in this browser's localStorage, keyed by category.
 */
export const useManualAssetsStore = create<ManualAssetsState>()(
  persist(
    (set) => ({
      entries: {},
      addEntry: (category, data) =>
        set((s) => ({
          entries: {
            ...s.entries,
            [category]: [
              ...(s.entries[category] ?? []),
              {
                id: `asset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
                createdAt: Date.now(),
                data,
              },
            ],
          },
        })),
      updateEntry: (category, id, data) =>
        set((s) => ({
          entries: {
            ...s.entries,
            [category]: (s.entries[category] ?? []).map((e) =>
              e.id === id ? { ...e, data } : e,
            ),
          },
        })),
      removeEntry: (category, id) =>
        set((s) => ({
          entries: {
            ...s.entries,
            [category]: (s.entries[category] ?? []).filter((e) => e.id !== id),
          },
        })),
    }),
    { name: "finsharpe.import.manual-assets" },
  ),
);
