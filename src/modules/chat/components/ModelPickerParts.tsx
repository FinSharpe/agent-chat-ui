import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { AlertTriangle, Check, ChevronDown, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AUTO_LABEL,
  isBlocked,
  unavailableNotice,
  type PickerRow,
  type PinState,
} from "../utils/pin";

type PillProps = ComponentPropsWithoutRef<"button"> & {
  pin: PinState;
  open: boolean;
  compact: boolean;
};

/**
 * The composer's model pill. A pin shows by its label even while the list
 * is still loading, because that is what the next Run will go out on; a pin
 * that cannot run keeps its label and is marked unavailable, never shown as
 * Auto (finsharpe-agents#255).
 */
export const ModelPill = forwardRef<HTMLButtonElement, PillProps>(
  function ModelPill({ pin, open, compact, className, ...props }, ref) {
    const blocked = isBlocked(pin);
    const label = pin.kind === "pinned" ? pin.shortLabel : AUTO_LABEL;
    return (
      <button
        ref={ref}
        type="button"
        title={
          blocked && pin.kind === "pinned"
            ? `${pin.label} isn't available right now`
            : "Model"
        }
        data-unavailable={blocked || undefined}
        className={cn(
          "flex shrink-0 items-center rounded-full font-medium transition-colors",
          blocked
            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
            : "bg-[#DFF9EF] text-[#0A1F4D]",
          compact
            ? "h-8 gap-1 pr-2.5 pl-2 text-[11px]"
            : "h-9 gap-1.5 pr-3 pl-3.5 text-[12px]",
          className,
        )}
        {...props}
      >
        {blocked ? <AlertTriangle size={13} /> : <Layers size={13} />}
        <span className="max-w-[220px] truncate">{label}</span>
        {blocked && <span className="sr-only"> (unavailable)</span>}
        {/* The phone bar is tight: the model name matters more than the
            caret, and the pill still reads as a control. */}
        {!compact && (
          <ChevronDown
            size={12}
            className={cn("transition-transform", open && "rotate-180")}
          />
        )}
      </button>
    );
  },
);

/**
 * The popover's contents: a header, the notice when the pin cannot run,
 * Auto first, then the models grouped by provider. The pin that cannot run
 * keeps its row, checked, marked "Unavailable" and not choosable.
 */
export function ModelChoiceList({
  pin,
  groups,
  waiting,
  onChoose,
}: {
  pin: PinState;
  groups: [string, PickerRow[]][];
  /** A send is held until the user chooses. */
  waiting: boolean;
  onChoose: (id: string | null) => void;
}) {
  const notice = unavailableNotice(pin, waiting);
  const pinnedId = pin.kind === "pinned" ? pin.id : null;
  const headerLabel = pin.kind === "pinned" ? pin.label : AUTO_LABEL;
  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
        <span className="font-geist text-[11px] font-medium text-[#0A1F4D]">
          AI Model
        </span>
        <span className="truncate text-[9px] font-medium text-slate-400">
          {headerLabel} {notice ? "unavailable" : "selected"}
        </span>
      </div>
      {notice && (
        <p
          role="status"
          className="rounded-nested flex items-start gap-1.5 bg-amber-500/10 px-2.5 py-2 text-[10px] leading-snug text-amber-700 dark:text-amber-300"
        >
          <AlertTriangle
            size={12}
            className="mt-px shrink-0"
          />
          <span>{notice}</span>
        </p>
      )}
      <div className="space-y-1">
        <Row
          label={AUTO_LABEL}
          description="Picks a model for each message"
          isOn={pin.kind === "auto"}
          onClick={() => onChoose(null)}
        />
      </div>
      {groups.map(([provider, rows]) => (
        <div
          key={provider}
          className="space-y-1"
        >
          <span className="block px-1.5 text-[8px] font-medium tracking-wider text-slate-400 uppercase">
            {provider}
          </span>
          {rows.map((m) => (
            <Row
              key={m.id}
              label={m.label}
              isOn={m.id === pinnedId}
              unavailable={!m.choosable}
              onClick={() => onChoose(m.id)}
            />
          ))}
        </div>
      ))}
    </>
  );
}

function Row({
  label,
  description,
  isOn,
  unavailable = false,
  onClick,
}: {
  label: string;
  description?: string;
  isOn: boolean;
  unavailable?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={unavailable}
      aria-disabled={unavailable || undefined}
      className={cn(
        "rounded-tile flex w-full items-center justify-between gap-3 px-1.5 py-1.5 text-left transition-colors",
        unavailable ? "cursor-not-allowed" : "hover-tint",
      )}
    >
      <span className="min-w-0">
        <span
          className={cn(
            "block text-[11px]",
            unavailable
              ? "text-slate-400"
              : isOn
                ? "font-medium text-[#0A1F4D]"
                : "text-slate-500",
          )}
        >
          {label}
        </span>
        {description && (
          <span className="block text-[9px] leading-snug text-slate-400">
            {description}
          </span>
        )}
        {unavailable && (
          <span className="block text-[9px] leading-snug font-medium text-amber-700 dark:text-amber-300">
            Unavailable
          </span>
        )}
      </span>
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all",
          isOn && !unavailable
            ? "bg-[#063BAA] text-white"
            : isOn
              ? "bg-slate-300 text-white dark:bg-slate-600"
              : "border border-slate-200 dark:border-slate-700",
        )}
      >
        {isOn && (
          <Check
            size={10}
            strokeWidth={3.5}
          />
        )}
      </span>
    </button>
  );
}
