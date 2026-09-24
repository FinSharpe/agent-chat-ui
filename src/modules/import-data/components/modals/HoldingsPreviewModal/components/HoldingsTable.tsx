import { useEffect, useMemo, useRef, useState } from "react";
import { Control, FieldArrayWithId, useWatch } from "react-hook-form";
import { ChevronDown, ChevronUp, Inbox } from "lucide-react";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import { EmptyState } from "@/modules/import-data/components/shared/ui";
import { HoldingTableRow } from "./HoldingTableRow";
import { RemovedHoldingRow } from "./RemovedHoldingRow";
import type { HoldingFormData, RemovedHolding } from "../hooks/useHoldingsForm";
import type { HoldingWithQuantity } from "../utils/holdings-transformer";
import { ledgerTotals } from "../utils/holding-value";

type HoldingsTableProps = {
  /** Field array items from react-hook-form */
  fields: FieldArrayWithId<HoldingFormData, "holdings", "id">[];
  /** Form control from react-hook-form */
  control: Control<HoldingFormData>;
  /** Consent type to determine column labels and prices */
  consentType: ConsentType;
  /** Field ids marked for removal, still showing their Undo */
  pendingRemovals: ReadonlySet<string>;
  /** Callback to remove a holding by index */
  onRemove: (index: number) => void;
  /** Keep a row marked for removal, by field id */
  onUndoRemove: (id: string) => void;
  /** Reported holdings taken out, drawn below with their Undo */
  removed: RemovedHolding[];
  /** Put a removed reported holding back */
  onRestore: (id: string) => void;
  /** A holding's place in the reported book (undefined if added) */
  originOf: (holding: HoldingWithQuantity | undefined) => number | undefined;
};

type Row =
  | { kind: "live"; index: number }
  | { kind: "removed"; entry: RemovedHolding };

/**
 * Live rows in order with each removed reported holding back in its place:
 * live reported rows keep the reported order, so a removed one goes before
 * the first live row that came after it in the book.
 */
function orderRows(
  holdings: HoldingWithQuantity[],
  removed: RemovedHolding[],
  originOf: HoldingsTableProps["originOf"],
): Row[] {
  const pending = [...removed].sort((a, b) => a.origin - b.origin);
  const rows: Row[] = [];
  let next = 0;
  for (let index = 0; index < holdings.length; index++) {
    const origin = originOf(holdings[index]) ?? Infinity;
    while (next < pending.length && pending[next].origin < origin) {
      rows.push({ kind: "removed", entry: pending[next++] });
    }
    rows.push({ kind: "live", index });
  }
  while (next < pending.length) {
    rows.push({ kind: "removed", entry: pending[next++] });
  }
  return rows;
}

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
  pendingRemovals,
  onRemove,
  onUndoRemove,
  removed,
  onRestore,
  originOf,
}: HoldingsTableProps) {
  const [expanded, setExpanded] = useState(false);
  // A holding added from search lands at the end of the list — open the
  // table so the new row (and its units field) is visible. Only a new last
  // row that is not from the reported book counts: the first fill and a
  // restore (even one back into last place) are reported holdings.
  const last = fields.at(-1);
  const lastId = last?.id;
  const lastIsAdded = last !== undefined && originOf(last) === undefined;
  const prev = useRef({ count: fields.length, lastId });
  useEffect(() => {
    const was = prev.current;
    if (fields.length > was.count && lastId !== was.lastId && lastIsAdded) {
      setExpanded(true);
    }
    prev.current = { count: fields.length, lastId };
  }, [fields.length, lastId, lastIsAdded]);
  const watched = useWatch({ control, name: "holdings" }) as
    | HoldingWithQuantity[]
    | undefined;
  // Right after a remove or insert, `fields` has the new rows while the
  // watched values are a render behind; reading them then drew every later
  // row with its neighbour's value and order for a frame. The fields carry
  // the same holdings, so use them until the two agree.
  const holdings = watched?.length === fields.length ? watched : fields;
  const totals = ledgerTotals(holdings, consentType);
  // `fields` only changes on add/remove/restore, so a keystroke in a units
  // field doesn't re-key every row.
  const rows = useMemo(
    () => orderRows(fields, removed, originOf),
    [fields, removed, originOf],
  );

  if (fields.length === 0 && removed.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No holdings yet"
        description="Search above to add holdings, then set their units before importing."
        className="p-6"
      />
    );
  }

  const visible = expanded ? rows : rows.slice(0, COLLAPSED_ROWS);

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
          {visible.map((row) => {
            if (row.kind === "removed") {
              return (
                <RemovedHoldingRow
                  key={row.entry.id}
                  entry={row.entry}
                  consentType={consentType}
                  onRestore={onRestore}
                />
              );
            }
            const { index } = row;
            const field = fields[index];
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
                pendingRemoval={pendingRemovals.has(field.id)}
                onRemove={onRemove}
                onUndoRemove={onUndoRemove}
              />
            );
          })}
        </tbody>
      </table>
      {rows.length > COLLAPSED_ROWS && (
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
              <span>Show all {rows.length} holdings</span>
              <ChevronDown size={11} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
