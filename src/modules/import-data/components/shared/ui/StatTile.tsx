import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { INTENT_VALUE, type SurfaceIntent } from "./intent";

type StatTileProps = {
  /** Small label above the figure, e.g. "Total Value". */
  label: string;
  /** The headline figure (already formatted, or a node). */
  value: ReactNode;
  /** Kept for API compatibility — the reference tiles carry no icon. */
  icon?: ComponentType<{ className?: string }>;
  /** Colour intent of the figure (semantic colour only where it means something). */
  intent?: SurfaceIntent;
  /** Longer explanation, surfaced as the tile's native tooltip. */
  tooltip?: string;
  /** Caption under the figure, e.g. "15 stocks" or "+0.39% today". */
  hint?: ReactNode;
  className?: string;
};

/**
 * KPI tile from the reference analysis modals: a small centred glass card with
 * label, figure and caption.
 */
export function StatTile({
  label,
  value,
  intent = "neutral",
  tooltip,
  hint,
  className,
}: StatTileProps) {
  return (
    <div
      title={tooltip}
      className={cn(
        "glass-card rounded-nested min-w-0 space-y-0.5 p-3 text-center",
        className,
      )}
    >
      <p className="text-[10px] leading-tight font-medium text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          "truncate text-sm font-medium tabular-nums",
          INTENT_VALUE[intent],
        )}
      >
        {value}
      </p>
      {hint && (
        <p className="line-clamp-2 text-[8.5px] leading-snug text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Row of stat tiles: three across (the reference), four on wider screens. */
export function StatGrid({
  children,
  count = 3,
}: {
  children: ReactNode;
  count?: 3 | 4;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        count === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3",
      )}
    >
      {children}
    </div>
  );
}
