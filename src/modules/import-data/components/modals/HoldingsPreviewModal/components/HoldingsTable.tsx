import { useEffect, useRef, useState } from "react";
import { Control, FieldArrayWithId, useWatch } from "react-hook-form";
import { ChevronDown, ChevronUp, Inbox } from "lucide-react";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { EmptyState } from "@/modules/import-data/components/shared/ui";
import { HoldingTableRow } from "./HoldingTableRow";
import { HoldingFormData } from "../hooks/useHoldingsForm";
import type { HoldingWithQuantity } from "../utils/holdings-transformer";
import { ledgerTotals } from "../utils/holding-value";

type HoldingsTableProps = {
  /** Field array items from react-hook-form */
  fields: FieldArrayWithId<HoldingFormData, "holdings", "id">[];
  /** Form control from react-hook-form */
  control: Control<HoldingFormData>;
  /** Consent type to determine column labels and prices */
  consentType: ConsentType;
  /** Callback to remove a holding by index */
  onRemove: (index: number) => void;
};

/** Rows shown before "Show all" (the reference collapses long tables the same way). */
const COLLAPSED_ROWS = 6;

const FIRST_COLUMN: Partial<Record<ConsentType, string>> = {
  [ConsentType.EQUITIES]: "Stock",
  [ConsentType.MUTUAL_FUNDS]: "Fund",
  [ConsentType.ETF]: "ETF",
};

/**
 * Editable holdings ledger in the reference table style (STOCK · UNITS ·
 * VALUE · WT %), with live value and weight as units change and a
 * "Show all N holdings" toggle for long lists.
 */
export function HoldingsTable({
  fields,
  control,
  consentType,
  onRemove,
}: HoldingsTableProps) {
  const [expanded, setExpanded] = useState(false);
  // A holding added from search lands at the end of the list — open the
  // table so the new row (and its units field) is visible.
  const prevCount = useRef(fields.length);
  useEffect(() => {
    if (fields.length > prevCount.current && prevCount.current > 0) {
      setExpanded(true);
    }
    prevCount.current = fields.length;
  }, [fields.length]);
  const holdings = useWatch({ control, name: "holdings" }) as
    | HoldingWithQuantity[]
    | undefined;
  const totals = ledgerTotals(holdings, consentType);

  if (fields.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No holdings yet"
        description="Search above to add holdings, then set their units before importing."
        className="p-6"
      />
    );
  }

  const visible = expanded ? fields : fields.slice(0, COLLAPSED_ROWS);

  return (
    <div className="space-y-3">
      <table className="w-full table-fixed border-collapse text-left text-[11px]">
        <thead>
          <tr className="border-b border-slate-50 font-medium text-slate-400 uppercase dark:border-slate-800">
            <th className="pb-2 font-medium">
              {FIRST_COLUMN[consentType] ?? "Holding"}
            </th>
            <th className="w-[4.75rem] pb-2 text-right font-medium sm:w-[6.25rem]">
              Units
            </th>
            <th className="w-16 pb-2 text-right font-medium">Value</th>
            <th className="hidden w-14 pb-2 text-right font-medium sm:table-cell">
              Wt %
            </th>
            <th className="w-9 pb-2">
              <span className="sr-only">Remove</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50/50 dark:divide-slate-800/30">
          {visible.map((field, index) => {
            const value = totals.values[index] ?? 0;
            return (
              <HoldingTableRow
                key={field.id}
                field={field}
                index={index}
                control={control}
                consentType={consentType}
                value={value}
                weight={
                  totals.value > 0 && value > 0
                    ? (value / totals.value) * 100
                    : null
                }
                onRemove={onRemove}
              />
            );
          })}
        </tbody>
      </table>
      {fields.length > COLLAPSED_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1 text-[10px] font-medium text-[#063BAA] hover:underline dark:text-[#8FB4FF]"
        >
          {expanded ? (
            <>
              <span>Hide details</span>
              <ChevronUp size={11} />
            </>
          ) : (
            <>
              <span>Show all {fields.length} holdings</span>
              <ChevronDown size={11} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
