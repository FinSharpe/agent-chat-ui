"use client";

import { AlertTriangle, Check, MinusCircle, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { STEP_STATUS_LABEL } from "../../constants/presentation";
import type { StepState } from "../../types/pipelines.types";

/**
 * The run timeline.
 *
 * Steps run dependency-aware and in parallel, so they finish out of order —
 * a numbered stepper would promise a sequence the runner does not follow.
 * Each row therefore carries its own state, and the only ordering claim the
 * screen makes is the manifest's reading order.
 */

function StatusMark({ status }: { status: string }) {
  const base =
    "flex size-6 shrink-0 items-center justify-center rounded-full border";
  switch (status) {
    case "succeeded":
      return (
        <span
          className={cn(
            base,
            "border-success-border bg-success-bg text-success-fg",
          )}
        >
          <Check className="size-3.5" />
        </span>
      );
    case "failed":
      return (
        <span
          className={cn(base, "border-error-border bg-error-bg text-error-fg")}
        >
          <X className="size-3.5" />
        </span>
      );
    case "coverage_gap":
      return (
        <span
          className={cn(
            base,
            "border-warning-border bg-warning-bg text-warning-fg",
          )}
        >
          <MinusCircle className="size-3.5" />
        </span>
      );
    // Skipped like a coverage gap and marked like one, but never coloured
    // like one: nothing is out of coverage here, the step simply has not
    // been built yet, so the mark stays muted rather than cautionary.
    case "not_wired":
      return (
        <span className={cn(base, "border-border-default bg-bg-subtle")}>
          <MinusCircle className="text-text-muted size-3.5" />
        </span>
      );
    case "running":
      return (
        <span className={cn(base, "border-primary/40 bg-primary/10")}>
          <span className="relative flex size-2">
            <span className="bg-primary absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:animate-none" />
            <span className="bg-primary relative inline-flex size-2 rounded-full" />
          </span>
        </span>
      );
    default:
      return (
        <span className={cn(base, "border-border-default bg-bg-subtle")}>
          <span className="bg-text-muted size-1.5 rounded-full" />
        </span>
      );
  }
}

export function RunTimeline({
  steps,
  coverageGaps,
}: {
  steps: StepState[];
  coverageGaps: string[];
}) {
  const gaps = new Set(coverageGaps);

  return (
    <ol className="space-y-3">
      {steps.map((step) => {
        // A gap declared at quote time is authoritative: the step is never
        // scheduled, so it can still be reading "pending" on the wire.
        const status = gaps.has(step.step_id) ? "coverage_gap" : step.status;
        return (
          <li
            key={step.step_id}
            className="border-border-subtle bg-bg-card flex items-start gap-3 rounded-lg border px-4 py-3"
          >
            <StatusMark status={status} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-text-primary text-sm font-medium">
                  {step.title || step.step_id}
                </span>
                <span
                  className={cn(
                    "text-xs",
                    status === "failed"
                      ? "text-error-fg"
                      : status === "coverage_gap"
                        ? "text-warning-fg"
                        : "text-text-tertiary",
                  )}
                >
                  {STEP_STATUS_LABEL[status] ?? status}
                </span>
              </div>
              {step.headline && (
                <p className="text-text-secondary mt-1 text-sm">
                  {step.headline}
                </p>
              )}
              {status === "coverage_gap" && !step.headline && (
                <p className="text-warning-fg mt-1 flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="size-3.5" />
                  Declared out of coverage before you paid — this section was
                  never run.
                </p>
              )}
              {status === "not_wired" && !step.headline && (
                <p className="text-text-tertiary mt-1 text-xs">
                  This section has not been built yet, so it did not run.
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
