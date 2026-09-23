"use client";

import { useMemo } from "react";
import { useAaPortfolio } from "@/modules/import-data/hooks/useAaPortfolio";
import { isInvestments, type ActiveSip } from "@/modules/import-data/types/aa";
import type { AlertClass } from "@/modules/import-data/utils/smart-alerts";

export interface PortfolioHolding {
  isin: string;
  name: string;
  /** Absolute INR market value of the position (drives top-by-value selection). */
  value: number;
  type: "equity" | "mf" | "etf";
}

/**
 * The user's imported equity, MF and ETF holdings, aggregated by ISIN with an absolute
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
  const etfs = positions.find((p) => p.type === "ETF");

  const holdings = useMemo<PortfolioHolding[]>(() => {
    const byIsin = new Map<string, PortfolioHolding>();

    const collect = (
      blobs: (typeof positions)[number]["blobs"],
      type: PortfolioHolding["type"],
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
    collect(etfs?.blobs ?? [], "etf");

    return Array.from(byIsin.values());
  }, [equities?.blobs, mutualFunds?.blobs, etfs?.blobs]);

  // The SIP detection rides on the mutual-funds consent's transactions; the
  // statement end is what "missed" is judged against (#86).
  const sipBook = useMemo(() => {
    const books = (mutualFunds?.blobs ?? [])
      .map((b) => b.normalized)
      .filter(isInvestments);
    const sips: ActiveSip[] = books.flatMap((n) => n.activeSips ?? []);
    const transactionsEnd =
      books
        .map((n) => n.transactionsEnd)
        .filter((d): d is string => !!d)
        .sort()
        .pop() ?? null;
    return { sips, transactionsEnd };
  }, [mutualFunds?.blobs]);

  /** The classes Smart Alerts groups by: every investment class held, and
   *  SIPs once the fund book shows installments to check. */
  const alertClasses = useMemo<AlertClass[]>(() => {
    const types = new Set(holdings.map((h) => h.type));
    return [
      ...(types.has("equity") ? (["EQUITIES"] as const) : []),
      ...(types.has("mf") ? (["MUTUAL_FUNDS"] as const) : []),
      ...(types.has("etf") ? (["ETF"] as const) : []),
      ...(sipBook.sips.length > 0 ? (["SIP"] as const) : []),
    ];
  }, [holdings, sipBook.sips.length]);

  return {
    holdings,
    isLoading,
    hasHoldings: holdings.length > 0,
    hasEquity: holdings.some((h) => h.type === "equity"),
    alertClasses,
    sipBook,
  };
}
