"use client";
import { type Control, useWatch } from "react-hook-form";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import {
  OverlayHeader,
  formatINRShort,
} from "@/modules/import-data/components/shared/ui";
import type { HoldingFormData } from "../hooks/useHoldingsForm";
import type { HoldingWithQuantity } from "../utils/holdings-transformer";
import { holdingNoun, ledgerTotals } from "../utils/holding-value";

/** Watch the ledger here so the header's summary line follows edits without
 *  re-rendering the analysis sections on every keystroke. */
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
