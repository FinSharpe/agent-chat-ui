"use client";
import { useMemo } from "react";
import { useAaPortfolio } from "@/modules/import-data/hooks/useAaPortfolio";
import {
  isInvestments,
  type ActiveSip,
  type NormalizedHolding,
} from "@/modules/import-data/types/aa";

export type MfSipSummary = {
  /** The SIPs detected in the mutual-funds consent's transactions. */
  sips: ActiveSip[];
  /** Sum of the monthly SIPs' installments; no other cadence is converted. */
  monthlyCommitment: number;
  monthlyCount: number;
  /** The earliest estimated next debit, when any SIP carries one. */
  nextDebit: { date: string; sip: ActiveSip; datedCount: number } | null;
  /** What the detected schemes are worth now, from the MF holdings. */
  value: number | null;
  /** The FIP's cost basis — only when the detected SIPs are the whole fund
   *  book, since cost is reported per account, never per scheme. */
  invested: { cost: number; coveredValue: number } | null;
  /** The detection window's end ("transactions to …"). */
  windowEnd: string | null;
  mfConnected: boolean;
  /** Connected, but its data has not landed (still syncing, or failed). */
  mfPending: boolean;
};

/**
 * The SIP money, which comes from the **mutual-funds** consent: its
 * transaction window carries priced installments the backend folds into
 * `activeSips` — the registrar's SIP consent shares Profile blocks only.
 * Mirrors finsharpe-mobile's `sips_screen.dart` `_SummaryStrip`.
 */
export function useMfSips(): MfSipSummary {
  const { positions, isLoading } = useAaPortfolio();
  const mf = positions.find((p) => p.type === "MUTUAL_FUNDS");

  return useMemo(() => {
    const books = (mf?.blobs ?? [])
      .map((b) => b.normalized)
      .filter(isInvestments);
    const sips = books.flatMap((n) => n.activeSips ?? []);
    const holdings: NormalizedHolding[] = books.flatMap((n) => n.holdings);
    const detected = new Set(sips.map((s) => s.isin));

    const monthly = sips.filter((s) => s.cadence === "monthly");
    const dated = sips
      .filter((s) => s.nextDebitEstimate)
      .sort((a, b) => a.nextDebitEstimate!.localeCompare(b.nextDebitEstimate!));

    let value: number | null = null;
    for (const h of holdings) {
      if (!detected.has(h.isin) || h.value == null) continue;
      value = (value ?? 0) + h.value;
    }

    let invested: MfSipSummary["invested"] = null;
    const wholeBook =
      holdings.length > 0 && holdings.every((h) => detected.has(h.isin));
    if (wholeBook) {
      let cost = 0;
      let covered = 0;
      let any = false;
      for (const n of books) {
        if (n.costValue == null || n.costBasisValue == null) continue;
        cost += n.costValue;
        covered += n.costBasisValue;
        any = true;
      }
      if (any && cost > 0) invested = { cost, coveredValue: covered };
    }

    const windowEnd =
      books
        .map((n) => n.transactionsEnd)
        .filter((d): d is string => !!d)
        .sort()
        .pop() ?? null;

    return {
      sips,
      monthlyCommitment: monthly.reduce((s, x) => s + x.installmentAmount, 0),
      monthlyCount: monthly.length,
      nextDebit: dated[0]
        ? {
            date: dated[0].nextDebitEstimate!,
            sip: dated[0],
            datedCount: dated.length,
          }
        : null,
      value: invested?.coveredValue ?? value,
      invested,
      windowEnd,
      mfConnected: (mf?.consents.length ?? 0) > 0,
      mfPending: isLoading || ((mf?.consents.length ?? 0) > 0 && !mf?.hasData),
    };
  }, [mf, isLoading]);
}
