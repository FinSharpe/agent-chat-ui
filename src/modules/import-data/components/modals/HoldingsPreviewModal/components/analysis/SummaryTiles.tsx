"use client";
import { type Control, useWatch } from "react-hook-form";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import type {
  CostBasis,
  Snapshot,
} from "@/modules/import-data/types/holdings-analysis";
import { cn } from "@/lib/utils";
import {
  StatTile,
  formatINRShort,
  formatPct,
} from "@/modules/import-data/components/shared/ui";
import type { HoldingFormData } from "../../hooks/useHoldingsForm";
import type { HoldingWithQuantity } from "../../utils/holdings-transformer";
import { holdingNoun, ledgerTotals } from "../../utils/holding-value";
import { shortDate } from "./format";

/**
 * Value, today's move, what it cost and the paper gain on it — mobile's
 * `_SummaryTiles`. Value follows the editable ledger; Invested and the gain
 * are what the FIP reported for the accounts it gave a cost for, never the
 * ledger minus a cost (that would book uncovered holdings as profit). A tile
 * with no data is dropped, and an odd count is filled so the grid never
 * strands one.
 */
export function SummaryTiles({
  control,
  consentType,
  fallbackValue,
  costBasis,
  snapshot,
}: {
  control: Control<HoldingFormData>;
  consentType: ConsentType;
  fallbackValue?: number | null;
  costBasis: CostBasis | null;
  snapshot: Snapshot | undefined;
}) {
  const holdings = (useWatch({ control, name: "holdings" }) ??
    []) as HoldingWithQuantity[];
  const totals = ledgerTotals(holdings, consentType);
  const value = totals.value > 0 ? totals.value : (fallbackValue ?? 0);
  const count = holdings.length;

  const tiles = [
    <StatTile
      key="value"
      label="Value"
      value={value > 0 ? formatINRShort(value) : "—"}
      hint={`${count} ${holdingNoun(consentType, count)}`}
    />,
  ];

  const move = snapshot?.day_move;
  if (move) {
    tiles.push(
      <StatTile
        key="today"
        label="Today"
        value={formatPct(move.pct, { decimals: 2 })}
        intent={move.pct >= 0 ? "positive" : "negative"}
        hint={`close ${shortDate(move.as_of)}`}
        tooltip="The holdings' weighted move over the latest session"
      />,
    );
  }

  if (costBasis) {
    const gain = costBasis.coveredValue - costBasis.cost;
    const whole = costBasis.coveragePct >= 99.5;
    tiles.push(
      <StatTile
        key="invested"
        label="Invested"
        value={formatINRShort(costBasis.cost)}
        hint={
          whole
            ? "as reported by your account"
            : `covers ${costBasis.coveragePct.toFixed(0)}% of value`
        }
      />,
      <StatTile
        key="gain"
        label="Unrealised gain"
        value={formatINRShort(gain, { signed: true })}
        intent={gain >= 0 ? "positive" : "negative"}
        hint={formatPct((gain / costBasis.cost) * 100)}
        tooltip="Paper gain on holdings still held. No purchase dates are shared, so no annualised return is claimed."
      />,
    );
  }

  if (tiles.length % 2 === 1) {
    const c = snapshot?.concentration;
    tiles.push(
      c ? (
        <StatTile
          key="top5"
          label="Top 5 weight"
          value={`${c.top_5_weight_pct.toFixed(1)}%`}
          hint={`of ${c.holdings} holdings`}
        />
      ) : (
        <StatTile
          key="count"
          label="Holdings"
          value={count}
        />
      ),
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2",
        tiles.length === 4 && "sm:grid-cols-4",
      )}
    >
      {tiles}
    </div>
  );
}
