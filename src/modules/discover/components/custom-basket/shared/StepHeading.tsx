"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

/**
 * A wizard step's title, with an optional confirmation on the right ("2
 * selected") and an optional line of guidance under it for the steps whose
 * controls are not self-explanatory.
 */
export function StepHeading({
  title,
  status,
  hint,
}: {
  title: string;
  /** Shown with a check, in mint, once the step has a valid answer. */
  status?: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-geist text-sm font-medium text-[#0A1F4D]">
          {title}
        </h3>
        {status && (
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-[#0A9E6E]">
            <Check
              size={11}
              strokeWidth={3}
            />
            {status}
          </span>
        )}
      </div>
      {hint && (
        <p className="text-[10px] leading-relaxed text-slate-400">{hint}</p>
      )}
    </div>
  );
}

/** The spacing the reference gives each step's option list. */
export const OPTION_LIST = "mt-3 space-y-3";
