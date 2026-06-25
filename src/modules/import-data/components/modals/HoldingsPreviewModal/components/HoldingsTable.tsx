import { Control, FieldArrayWithId } from "react-hook-form";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/modules/import-data/components/shared/ui";
import { HoldingTableRow } from "./HoldingTableRow";
import { HoldingFormData } from "../hooks/useHoldingsForm";
import {
  EQUITY_COLUMNS,
  MUTUAL_FUND_COLUMNS,
  ETF_COLUMNS,
  BANK_ACCOUNT_COLUMNS,
} from "../utils/holdings-constants";

type HoldingsTableProps = {
  /** Field array items from react-hook-form */
  fields: FieldArrayWithId<HoldingFormData, "holdings", "id">[];
  /** Form control from react-hook-form */
  control: Control<HoldingFormData>;
  /** Consent type to determine column structure */
  consentType: ConsentType;
  /** Callback to remove a holding by index */
  onRemove: (index: number) => void;
};

/**
 * Editable holdings table. Renders the column set for the active consent type
 * inside a bordered panel with a sticky, tokenised header and a horizontal
 * scroll fallback on narrow viewports.
 */
export function HoldingsTable({
  fields,
  control,
  consentType,
  onRemove,
}: HoldingsTableProps) {
  const getColumns = () => {
    switch (consentType) {
      case ConsentType.EQUITIES:
        return EQUITY_COLUMNS;
      case ConsentType.MUTUAL_FUNDS:
        return MUTUAL_FUND_COLUMNS;
      case ConsentType.ETF:
        return ETF_COLUMNS;
      case ConsentType.BANK_ACCOUNTS:
        return BANK_ACCOUNT_COLUMNS;
      default:
        return EQUITY_COLUMNS;
    }
  };

  const columns = getColumns();
  // The holdings ledger sits in a deliberately narrow pane; a fixed layout with
  // sized Units/Action columns keeps the company name + centred stepper + remove
  // all visible with no horizontal scroll. Bank accounts keep the auto layout.
  const isBank = consentType === ConsentType.BANK_ACCOUNTS;

  if (fields.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No holdings yet"
        description="Use the search above to add holdings, then set quantities before importing."
        className="border-border bg-card rounded-xl border border-dashed"
      />
    );
  }

  return (
    <div className="border-border bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
      <div className="scrollbar-thin min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <table
          className={cn(
            "w-full border-separate border-spacing-0 text-sm",
            !isBank && "table-fixed",
          )}
        >
          <thead className="sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "border-border-subtle bg-bg-subtle text-text-tertiary border-b px-3 py-2.5 text-[11px] font-semibold tracking-[0.06em] uppercase",
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                        ? "text-center"
                        : "text-left",
                    !isBank && column.key === "quantity" && "w-24",
                    column.key === "action" && "w-14",
                  )}
                >
                  {/* Action header would clip in the narrow column; keep it for
                      screen readers but hide the visible glyph. */}
                  {column.key === "action" ? (
                    <span className="sr-only">{column.label}</span>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <HoldingTableRow
                key={field.id}
                field={field}
                index={index}
                control={control}
                consentType={consentType}
                onRemove={onRemove}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
