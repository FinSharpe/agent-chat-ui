"use client";
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  HOLDINGS_ANALYSIS_CACHE,
  fetchHoldingsAnalysis,
  holdingsAnalysisKey,
} from "../api/holdings-analysis";
import { analysisRequest } from "../components/modals/HoldingsPreviewModal/utils/class-analysis";
import type { AnalysisKind, DayMove } from "../types/holdings-analysis";
import type { AaConsentType } from "../types/aa";
import type { ClassPosition } from "../utils/aa-fold";
import {
  classItems,
  portfolioDayMove,
  type PortfolioDayMove,
} from "../utils/day-move";

const INVESTED: { type: AaConsentType; kind: AnalysisKind }[] = [
  { type: "EQUITIES", kind: "equities" },
  { type: "MUTUAL_FUNDS", kind: "mutualFunds" },
  { type: "ETF", kind: "etf" },
];

export type DayMoveState =
  /** No invested class to move — a book of bank balances only. */
  | { status: "none" }
  | { status: "loading" }
  /** A class failed or served no move: the card draws no line. */
  | { status: "unavailable" }
  | (PortfolioDayMove & { status: "ready"; asOf: string | null });

const dayMoveOf = (json: Record<string, unknown>): DayMove | null => {
  const snapshot = json.snapshot as { day_move?: DayMove | null } | undefined;
  const move = snapshot?.day_move;
  return move && typeof move.pct === "number" && Number.isFinite(move.pct)
    ? move
    : null;
};

/**
 * The book's move over the latest session, from each invested class's
 * analysis — the request the Analyse view makes, so the two share a cache.
 * Every class the user holds must report a move, or there is none to show
 * (mobile's `_SummaryCard`).
 */
export function useDayMove(positions: ClassPosition[]): DayMoveState {
  const classes = useMemo(
    () =>
      INVESTED.flatMap(({ type, kind }) => {
        const position = positions.find((p) => p.type === type);
        if (!position) return [];
        const request = analysisRequest(kind, classItems(position.blobs));
        if (request.itemCount === 0) return [];
        return [
          {
            value: position.value,
            url: request.url,
            body: JSON.stringify(request.body),
          },
        ];
      }),
    [positions],
  );

  const investmentsTotal = positions
    .filter((p) => INVESTED.some((i) => i.type === p.type))
    .reduce((sum, p) => sum + (p.value ?? 0), 0);

  const results = useQueries({
    queries: classes.map((c) => ({
      queryKey: holdingsAnalysisKey(c.url, c.body),
      queryFn: () => fetchHoldingsAnalysis(c.url, c.body),
      select: dayMoveOf,
      ...HOLDINGS_ANALYSIS_CACHE,
    })),
  });

  if (classes.length === 0) return { status: "none" };
  if (results.some((r) => r.isPending)) return { status: "loading" };

  const move = portfolioDayMove(
    classes.map((c, i) => ({
      value: c.value,
      pct: results[i].data?.pct ?? null,
    })),
    investmentsTotal,
  );
  if (!move) return { status: "unavailable" };

  const asOf =
    results
      .map((r) => r.data?.as_of)
      .filter((d): d is string => !!d)
      .sort()
      .pop() ?? null;
  return { status: "ready", ...move, asOf };
}
