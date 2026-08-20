"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CatalogStep } from "../../types/pipelines.types";

/**
 * What the price buys, named.
 *
 * Numbered only where the order is real. An instrument Pipeline's sections are
 * researched in parallel and carry no order — the same reason the run view
 * refuses to imply one — while a market Pipeline is a funnel, each step
 * consuming the last one's output.
 */
export function StepList({
  steps,
  ordered,
  className,
}: {
  steps: CatalogStep[];
  ordered: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-2", className)}>
      {steps.map((step, index) => (
        <li
          key={step.id}
          className="text-text-secondary flex items-baseline gap-2.5 text-sm"
        >
          {ordered ? (
            <span className="text-text-tertiary w-4 shrink-0 text-right text-xs tabular-nums">
              {index + 1}
            </span>
          ) : (
            <Check className="text-brand-teal size-3.5 shrink-0 translate-y-0.5" />
          )}
          {step.name}
        </li>
      ))}
    </ul>
  );
}
