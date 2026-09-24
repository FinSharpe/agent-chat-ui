import { RotateCcw } from "lucide-react";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import type { RemovedHolding } from "../hooks/useHoldingsForm";
import { getHoldingName } from "../utils/holdings-constants";
import { holdingSubtitle } from "../utils/holding-value";

/** The Undo that takes the place of a removed row's remove button. */
export function UndoRemoveButton({
  name,
  onClick,
}: {
  name: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Undo removing ${name}`}
      title="Undo"
      className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-[#063BAA] transition-colors hover:bg-[#EDF3FF] dark:text-[#8FB4FF] dark:hover:bg-slate-800/60"
    >
      <RotateCcw size={14} />
    </button>
  );
}

/**
 * A reported holding the user took out: struck through with the units it had,
 * out of the totals, and an Undo that stays until they put it back or import.
 */
export function RemovedHoldingRow({
  entry,
  consentType,
  onRestore,
}: {
  entry: RemovedHolding;
  consentType: ConsentType;
  onRestore: (id: string) => void;
}) {
  const name = getHoldingName(entry.holding, consentType);
  const sub = holdingSubtitle(entry.holding, consentType);

  return (
    <tr>
      <td className="py-2.5 pr-2 opacity-40">
        <span
          className="text-forest-deep block truncate font-medium line-through dark:text-white"
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
      <td className="py-2.5 pr-1.5 text-right text-slate-500 tabular-nums line-through opacity-40">
        {entry.holding.quantity}
      </td>
      <td className="py-2.5 text-right text-slate-400">—</td>
      <td className="hidden py-2.5 text-right text-slate-400 sm:table-cell">
        —
      </td>
      <td className="py-2.5 pl-1 text-right">
        <UndoRemoveButton
          name={name}
          onClick={() => onRestore(entry.id)}
        />
      </td>
    </tr>
  );
}
