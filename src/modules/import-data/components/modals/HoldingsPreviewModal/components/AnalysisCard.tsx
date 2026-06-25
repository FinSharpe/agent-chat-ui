import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A titled surface used across the analysis canvas (returns chart, score
 * gauges, cost). One border, one radius, one header treatment so the dashboard
 * reads as a coherent set of widgets.
 */
export function AnalysisCard({
  title,
  hint,
  children,
  className,
}: {
  title: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        // min-w-0 lets the card shrink inside a grid track so charts never force
        // the dashboard to scroll horizontally inside a narrow sheet.
        "border-border bg-card min-w-0 rounded-xl border p-4 shadow-sm",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-text-tertiary text-xs font-semibold tracking-[0.04em] uppercase">
          {title}
        </h3>
        {hint && <span className="text-text-muted text-xs">{hint}</span>}
      </div>
      {children}
    </section>
  );
}
