"use client";

import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { getUserConsent } from "@/lib/moneyone/moneyone.storage";
import { extractHoldingsFromFiData } from "@/modules/import-data/components/modals/HoldingsPreviewModal/utils/holdings-transformer";
import { useFiData } from "@/modules/import-data/hooks/useFiData";
import type { EquityHolding } from "@/modules/import-data/types/equities";
import type { MutualFundHolding } from "@/modules/import-data/types/mutual-funds";
import { useEffect, useMemo, useState } from "react";

export interface PortfolioHolding {
  isin: string;
  name: string;
  /** Absolute INR market value of the position (drives top-by-value selection). */
  value: number;
  type: "equity" | "mf";
}

function num(value?: string | null): number {
  const parsed = parseFloat(value ?? "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * The user's imported equity + MF holdings, aggregated by ISIN with an absolute
 * market value, ready to feed the nudge endpoints.
 *
 * Consents are read from localStorage in an effect (client-only) to avoid an SSR
 * hydration mismatch; holdings come from the already-cached MoneyOne FI data.
 */
export function usePortfolioHoldings() {
  const [consents, setConsents] = useState<{
    eq?: string;
    mf?: string;
    ready: boolean;
  }>({ ready: false });

  useEffect(() => {
    setConsents({
      eq: getUserConsent(ConsentType.EQUITIES)?.consentID,
      mf: getUserConsent(ConsentType.MUTUAL_FUNDS)?.consentID,
      ready: true,
    });
  }, []);

  const eqFi = useFiData(consents.eq, !!consents.eq);
  const mfFi = useFiData(consents.mf, !!consents.mf);

  const holdings = useMemo<PortfolioHolding[]>(() => {
    const byIsin = new Map<string, PortfolioHolding>();

    const add = (holding: PortfolioHolding) => {
      const existing = byIsin.get(holding.isin);
      if (existing) existing.value += holding.value;
      else byIsin.set(holding.isin, holding);
    };

    for (const h of extractHoldingsFromFiData(eqFi.data) as EquityHolding[]) {
      if (!h.isin) continue;
      add({
        isin: h.isin,
        name: h.issuerName || h.isinDescription || h.isin,
        value: num(h.units) * num(h.lastTradedPrice),
        type: "equity",
      });
    }

    for (const h of extractHoldingsFromFiData(
      mfFi.data,
    ) as MutualFundHolding[]) {
      if (!h.isin) continue;
      add({
        isin: h.isin,
        name: h.isinDescription || h.amc || h.isin,
        value: num(h.closingUnits) * num(h.nav),
        type: "mf",
      });
    }

    return Array.from(byIsin.values());
  }, [eqFi.data, mfFi.data]);

  const isLoading =
    (!!consents.eq && eqFi.isLoading) || (!!consents.mf && mfFi.isLoading);

  return {
    holdings,
    isLoading: !consents.ready || isLoading,
    hasHoldings: holdings.length > 0,
    hasEquity: holdings.some((h) => h.type === "equity"),
  };
}
