"use client";

import { Minus, Plus } from "lucide-react";

const STEP_BUTTON =
  "flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-[#0A1F4D] transition-colors hover-tint disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-white";

/**
 * A −/+ pair around a value, for the fund steps' weights and scheme counts.
 */
export function Stepper({
  value,
  label,
  onDecrement,
  onIncrement,
  canDecrement = true,
  canIncrement = true,
}: {
  value: string;
  /** What is being stepped, for the buttons' accessible names. */
  label: string;
  onDecrement: () => void;
  onIncrement: () => void;
  canDecrement?: boolean;
  canIncrement?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={onDecrement}
        disabled={!canDecrement}
        className={STEP_BUTTON}
        aria-label={`Decrease ${label}`}
      >
        <Minus size={13} />
      </button>
      <span className="w-10 text-center text-[12px] font-medium text-[#0A1F4D] tabular-nums dark:text-white">
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={!canIncrement}
        className={STEP_BUTTON}
        aria-label={`Increase ${label}`}
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
