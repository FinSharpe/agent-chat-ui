import type { ComponentType } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { INTENT_CHIP, INTENT_VALUE, type SurfaceIntent } from "./intent";

type StatTileProps = {
  /** Uppercase eyebrow label, e.g. "Total Income". */
  label: string;
  /** The headline figure (string already formatted, or a node). */
  value: React.ReactNode;
  /** Optional Lucide icon shown in the tinted corner chip. */
  icon?: ComponentType<{ className?: string }>;
  /** Colour intent — drives the chip tint and (for money) the value colour. */
  intent?: SurfaceIntent;
  /** Optional explanatory tooltip surfaced via an info dot beside the label. */
  tooltip?: string;
  /** Small caption under the value, e.g. a date range. */
  hint?: string;
  className?: string;
};

/**
 * A single KPI tile in the "Calm Ledger" language: neutral elevated card,
 * tabular figure, intent expressed through a tinted icon chip (and value colour
 * only where it's semantically money-in / money-out). The calm default keeps
 * dense stat grids from turning into a wall of colour.
 */
export function StatTile({
  label,
  value,
  icon: Icon,
  intent = "neutral",
  tooltip,
  hint,
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "border-border bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-text-tertiary text-[11px] font-medium tracking-[0.07em] uppercase">
            {label}
          </span>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`About ${label}`}
                  className="text-text-muted hover:text-text-secondary focus-visible:ring-ring inline-flex items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs leading-relaxed">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {Icon && (
          <span
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              INTENT_CHIP[intent],
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="space-y-1">
        <p
          className={cn(
            "text-xl leading-none font-semibold tracking-tight tabular-nums md:text-2xl",
            INTENT_VALUE[intent],
          )}
        >
          {value}
        </p>
        {hint && <p className="text-text-tertiary text-xs">{hint}</p>}
      </div>
    </div>
  );
}
