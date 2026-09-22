import { memo } from "react";
import { Control, Controller } from "react-hook-form";
import { X } from "lucide-react";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { formatINRShort } from "@/modules/import-data/components/shared/ui";
import { HoldingFormData } from "../hooks/useHoldingsForm";
import { HoldingWithQuantity } from "../utils/holdings-transformer";
import { getHoldingName } from "../utils/holdings-constants";
import { holdingSubtitle } from "../utils/holding-value";

type HoldingTableRowProps = {
  /** Field data for this row */
  field: HoldingWithQuantity & { id: string };
  /** Index of this row in the field array */
  index: number;
  /** Form control from react-hook-form */
  control: Control<HoldingFormData>;
  /** Consent type to determine which fields to display */
  consentType: ConsentType;
  /** Live market value of this row (0 when no price is known). */
  value: number;
  /** Share of the ledger's total value, or null when values are unknown. */
  weight: number | null;
  /** Callback to remove this holding */
  onRemove: (index: number) => void;
};

/**
 * One ledger row in the reference holdings-table style: name over a small
 * grey sub-line, an editable units field, value and weight, and a remove
 * control. Memoized so a keystroke in one row doesn't redraw the others'
 * inputs.
 */
export const HoldingTableRow = memo(function HoldingTableRow({
  field,
  index,
  control,
  consentType,
  value,
  weight,
  onRemove,
}: HoldingTableRowProps) {
  const name = getHoldingName(field, consentType);
  const sub = holdingSubtitle(field, consentType);

  return (
    <tr className="hover:bg-slate-100/20 dark:hover:bg-slate-800/10">
      <td className="py-2.5 pr-2">
        <span
          className="text-forest-deep block truncate font-medium dark:text-white"
          title={name}
        >
          {name}
        </span>
        {sub && (
          <span className="block truncate text-[9px] text-slate-400">
            {sub}
          </span>
        )}
      </td>
      <td className="py-2.5 text-right">
        <Controller
          control={control}
          name={`holdings.${index}.quantity`}
          rules={{ required: true, min: 0 }}
          render={({ field: inputField }) => (
            <input
              {...inputField}
              type="number"
              min="0"
              step="any"
              aria-label={`Units of ${name}`}
              className="rounded-nested text-forest-deep ml-auto block w-[4.25rem] bg-[#EDF3FF]/45 px-1.5 py-1.5 text-right text-[11px] tabular-nums outline-none focus:ring-2 focus:ring-[#063BAA]/20 sm:w-[5.25rem] dark:bg-slate-800/40 dark:text-white"
              onChange={(e) => {
                const next = parseFloat(e.target.value);
                inputField.onChange(isNaN(next) ? 0 : next);
              }}
            />
          )}
        />
      </td>
      <td className="text-forest-deep py-2.5 text-right font-medium tabular-nums dark:text-white">
        {value > 0 ? formatINRShort(value) : "—"}
      </td>
      <td className="hidden py-2.5 text-right text-slate-500 tabular-nums sm:table-cell">
        {weight === null ? "—" : `${weight.toFixed(1)}%`}
      </td>
      <td className="py-2.5 pl-1 text-right">
        <button
          type="button"
          onClick={() => onRemove(index)}
          aria-label={`Remove ${name}`}
          title="Remove"
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
        >
          <X size={14} />
        </button>
      </td>
    </tr>
  );
});
