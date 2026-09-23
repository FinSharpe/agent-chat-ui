"use client";

import { useMemo } from "react";
import { useAaPortfolio } from "@/modules/import-data/hooks/useAaPortfolio";
import { isInvestments } from "@/modules/import-data/types/aa";

export interface PortfolioHolding {
  isin: string;
  name: string;
  /** Absolute INR market value of the position (drives top-by-value selection). */
  value: number;
  type: "equity" | "mf";
}

/**
 * The user's imported equity + MF holdings, aggregated by ISIN with an absolute
 * market value, ready to feed the nudge endpoints.
 *
 * Reads the backend's normalized holdings — which already carry `value` — so
 * the nudges can't disagree with the net-worth card about what a position is
 * worth. Both read the same cached blobs.
 */
export function usePortfolioHoldings() {
  const { positions, isLoading } = useAaPortfolio();

  const equities = positions.find((p) => p.type === "EQUITIES");
  const mutualFunds = positions.find((p) => p.type === "MUTUAL_FUNDS");

  const holdings = useMemo<PortfolioHolding[]>(() => {
    const byIsin = new Map<string, PortfolioHolding>();

    const collect = (
      blobs: typeof positions[number]["blobs"],
      type: "equity" | "mf",
    ) => {
      for (const blob of blobs) {
        const n = blob.normalized;
        if (!isInvestments(n)) continue;
        for (const h of n.holdings) {
          if (!h.isin) continue;
          const value = h.value ?? (h.units ?? 0) * (h.price ?? 0);
          const existing = byIsin.get(h.isin);
          if (existing) existing.value += value;
          else
            byIsin.set(h.isin, {
              isin: h.isin,
              name: h.name || h.amc || h.isin,
              value,
              type,
            });
        }
      }
    };

    collect(equities?.blobs ?? [], "equity");
    collect(mutualFunds?.blobs ?? [], "mf");

    return Array.from(byIsin.values());
  }, [equities?.blobs, mutualFunds?.blobs]);

  return {
    holdings,
    isLoading,
    hasHoldings: holdings.length > 0,
    hasEquity: holdings.some((h) => h.type === "equity"),
  };
}
