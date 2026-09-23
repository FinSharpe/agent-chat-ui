"use client";

import type { ReactNode } from "react";

/**
 * "Pipeline Progress n/N" over a thin gradient bar — bare, no card, the way
 * the reference run view opens. `done` counts every settled step, not just
 * the successful ones, so a run with a coverage gap still reaches N/N.
 */
export function ProgressBlock({
  done,
  total,
  note,
}: {
  done: number;
  total: number;
  note?: ReactNode;
}) {
  const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
          Pipeline Progress
        </span>
        <span className="text-[11px] font-medium text-[#063BAA] tabular-nums">
          {done}/{total}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label="Pipeline progress"
      >
        <div
          className="bg-brand-gradient h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {note && (
        <p className="text-[10px] leading-relaxed text-slate-400">{note}</p>
      )}
    </div>
  );
}
