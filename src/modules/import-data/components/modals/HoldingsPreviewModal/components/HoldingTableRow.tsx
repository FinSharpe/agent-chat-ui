import { memo } from "react";
import { Control, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { HoldingFormData } from "../hooks/useHoldingsForm";
import { HoldingWithQuantity } from "../utils/holdings-transformer";
import { getHoldingName } from "../utils/holdings-constants";
import { BankAccountWithFormData } from "@/modules/import-data/types/bank-accounts";

type HoldingTableRowProps = {
  /** Field data for this row */
  field: HoldingWithQuantity & { id: string };
  /** Index of this row in the field array */
  index: number;
  /** Form control from react-hook-form */
  control: Control<HoldingFormData>;
  /** Consent type to determine which fields to display */
  consentType: ConsentType;
  /** Callback to remove this holding */
  onRemove: (index: number) => void;
};

const cellClass = "border-b border-border-subtle px-3 py-2.5 align-middle";

/** Subtle monospace chip used for ISIN / account-number identifiers. */
function IdentifierChip({ value }: { value: string }) {
  return (
    <span className="bg-bg-subtle text-text-tertiary inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[11px]">
      {value}
    </span>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label="Remove holding"
      className="text-text-tertiary hover:bg-error-bg hover:text-error-fg h-8 w-8"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

/**
 * Single row in the holdings table. Memoized to keep quantity edits from
 * re-rendering the whole list.
 */
export const HoldingTableRow = memo(function HoldingTableRow({
  field,
  index,
  control,
  consentType,
  onRemove,
}: HoldingTableRowProps) {
  // Bank accounts have a different column structure (read-only display fields).
  if (consentType === ConsentType.BANK_ACCOUNTS) {
    const bankAccount = field as unknown as BankAccountWithFormData;
    return (
      <tr className="hover:bg-bg-hover transition-colors">
        <td className={cn(cellClass, "text-text-primary font-medium")}>
          {bankAccount.displayBank || "—"}
        </td>
        <td className={cn(cellClass, "text-text-secondary")}>
          {bankAccount.displayAccountType || "—"}
        </td>
        <td className={cellClass}>
          {bankAccount.displayAccountNumber ? (
            <IdentifierChip value={bankAccount.displayAccountNumber} />
          ) : (
            "—"
          )}
        </td>
        <td
          className={cn(
            cellClass,
            "text-text-primary text-right font-semibold tabular-nums",
          )}
        >
          {bankAccount.displayBalance || "—"}
        </td>
        <td className={cn(cellClass, "text-center")}>
          <RemoveButton onClick={() => onRemove(index)} />
        </td>
      </tr>
    );
  }

  // Default rendering for equity, mutual funds, ETF.
  return (
    <tr className="hover:bg-bg-hover transition-colors">
      <td className={cn(cellClass, "text-text-primary font-medium")}>
        {getHoldingName(field, consentType)}
      </td>
      <td className={cn(cellClass, "px-2 text-center")}>
        <Controller
          control={control}
          name={`holdings.${index}.quantity`}
          rules={{ required: true, min: 0 }}
          render={({ field: inputField }) => (
            <Input
              {...inputField}
              type="number"
              min="0"
              step="any"
              aria-label="Quantity"
              className="mx-auto h-9 w-20 px-2 text-center tabular-nums"
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                inputField.onChange(isNaN(value) ? 0 : value);
              }}
            />
          )}
        />
      </td>
      <td className={cn(cellClass, "px-2 text-center")}>
        <RemoveButton onClick={() => onRemove(index)} />
      </td>
    </tr>
  );
});
