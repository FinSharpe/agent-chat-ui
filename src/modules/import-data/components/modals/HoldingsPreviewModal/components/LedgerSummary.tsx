"use client";
import { type Control, useWatch } from "react-hook-form";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import {
  OverlayHeader,
  StatGrid,
  StatTile,
  formatCount,
  formatINRShort,
} from "@/modules/import-data/components/shared/ui";
import type { HoldingFormData } from "../hooks/useHoldingsForm";
import type { HoldingWithQuantity } from "../utils/holdings-transformer";
import { getHoldingName } from "../utils/holdings-constants";
import { holdingNoun, ledgerTotals } from "../utils/holding-value";

/** Watch the ledger in one place so the analysis cards don't re-render on
 *  every keystroke — only these small summaries do. */
function useLedger(
  control: Control<HoldingFormData>,
  consentType: ConsentType,
) {
  const holdings = useWatch({ control, name: "holdings" }) as
    | HoldingWithQuantity[]
    | undefined;
  return {
    holdings: holdings ?? [],
    totals: ledgerTotals(holdings, consentType),
  };
}

/** Modal header whose summary line follows the ledger ("₹12.4L • 10 stocks"). */
export function LedgerHeader({
  control,
  consentType,
  title,
  fallbackValue,
  isLoading,
  onClose,
}: {
  control: Control<HoldingFormData>;
  consentType: ConsentType;
  title: string;
  /** Account-level current value, used when no holding carries a price. */
  fallbackValue?: number | null;
  isLoading: boolean;
  onClose: () => void;
}) {
  const { holdings, totals } = useLedger(control, consentType);
  const value = totals.value > 0 ? totals.value : (fallbackValue ?? 0);
  const count = holdings.length;
  const subtitle = isLoading
    ? "Loading holdings…"
    : [
        value > 0 ? formatINRShort(value) : null,
        `${count} ${holdingNoun(consentType, count)}`,
      ]
        .filter(Boolean)
        .join(" • ");
  return (
    <OverlayHeader
      title={title}
      subtitle={subtitle}
      onClose={onClose}
    />
  );
}

/** The three reference stat tiles, computed live from the edited ledger. */
export function LedgerStats({
  control,
  consentType,
  fallbackValue,
}: {
  control: Control<HoldingFormData>;
  consentType: ConsentType;
  fallbackValue?: number | null;
}) {
  const { holdings, totals } = useLedger(control, consentType);
  const count = holdings.length;
  const value = totals.value > 0 ? totals.value : (fallbackValue ?? 0);

  let topIndex = -1;
  totals.values.forEach((v, i) => {
    if (v > 0 && (topIndex < 0 || v > totals.values[topIndex])) topIndex = i;
  });
  const top = topIndex >= 0 ? holdings[topIndex] : null;

  return (
    <StatGrid>
      <StatTile
        label="Total Value"
        value={value > 0 ? formatINRShort(value) : "—"}
        hint={`${count} ${holdingNoun(consentType, count)}`}
        tooltip={
          totals.value > 0
            ? "Units × last price / NAV reported by your account"
            : "Reported account value (no per-holding prices)"
        }
      />
      <StatTile
        label="Total Units"
        value={formatCount(totals.units)}
        hint={`across ${count} ${holdingNoun(consentType, count)}`}
      />
      <StatTile
        label="Top Holding"
        value={
          top && totals.value > 0
            ? `${((totals.values[topIndex] / totals.value) * 100).toFixed(1)}%`
            : "—"
        }
        hint={top ? getHoldingName(top, consentType) : "no prices yet"}
      />
    </StatGrid>
  );
}
