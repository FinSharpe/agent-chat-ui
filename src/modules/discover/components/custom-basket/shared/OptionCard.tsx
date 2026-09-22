"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * One choice in a wizard step — the reference's OptionCard: a glass card
 * that fills brand blue when chosen, with a check disc on the right. Used for
 * single and multiple choice alike; the step decides what a tap does.
 */
export function OptionCard({
  title,
  description,
  selected,
  onClick,
  children,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  /** Extra content under the description (a preset's categories, say). */
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-nested flex w-full items-center justify-between gap-3 p-4.5 text-left transition-all active:scale-[0.99]",
        selected ? "bg-[#063BAA] text-white" : "glass-card text-[#0A1F4D]",
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="font-geist text-[13px] font-medium">{title}</p>
        {description && (
          <p
            className={cn(
              "text-[10px]",
              selected ? "text-white" : "text-slate-400",
            )}
          >
            {description}
          </p>
        )}
        {children}
      </div>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
          selected ? "bg-white text-[#063BAA]" : "border border-slate-200",
        )}
      >
        {selected && (
          <Check
            size={12}
            strokeWidth={3}
          />
        )}
      </span>
    </button>
  );
}
