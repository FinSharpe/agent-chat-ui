"use client";

import { Check, Loader2, Minus, X } from "lucide-react";

import { cn } from "@/lib/utils";

/** One row of the step list: a Step and where it stands. */
export interface StepRow {
  id: string;
  name: string;
  /** pending | running | succeeded | failed | coverage_gap | not_wired */
  status: string;
  /** The line under the name — a finished Step's headline, or why a Step
   *  produced nothing. */
  line?: string;
}

const MARK: Record<string, string> = {
  succeeded: "bg-[#97edcc]/30 text-[#0A9E6E]",
  running: "bg-[#063BAA] text-white",
  failed: "bg-rose-50 text-rose-500 dark:bg-rose-500/15",
  coverage_gap:
    "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  not_wired: "bg-slate-100 text-slate-400 dark:bg-slate-800",
  pending: "bg-slate-100 text-slate-400 dark:bg-slate-800",
};

const LINE: Record<string, string> = {
  succeeded: "text-[#0A9E6E]",
  failed: "text-rose-500",
  coverage_gap: "text-amber-600 dark:text-amber-400",
  not_wired: "text-slate-400",
  pending: "text-slate-400",
  running: "text-slate-400",
};

/**
 * The reference run view's step list: cardless rows split by hairlines, a
 * status mark on the left, the Step's output underneath once it has one.
 *
 * Numbered only where the order is real. A market Pipeline is a funnel, each
 * Step narrowing the last; an instrument Pipeline's Steps run in parallel and
 * finish out of order, so numbering them would promise a sequence the runner
 * does not follow — a waiting Step gets a dot instead.
 *
 * Only a Step still waiting is dimmed. A Step that settled without output (a
 * coverage gap, a failure, one not built yet) is as final as one that ran, and
 * its reason has to stay readable.
 */
export function PipelineSteps({
  steps,
  ordered,
  stalled = false,
}: {
  steps: StepRow[];
  ordered: boolean;
  /**
   * Set while the screen has lost contact with the server. The rows are then
   * the last thing we heard rather than what is happening, so the running
   * step's spinner stops: a spinner that keeps turning on frozen data promises
   * live progress the screen cannot see.
   */
  stalled?: boolean;
}) {
  return (
    <ol className="divide-y divide-slate-100 border-y border-slate-100 dark:divide-slate-800/60 dark:border-slate-800/60">
      {steps.map((step, index) => {
        const status = MARK[step.status] ? step.status : "pending";
        return (
          <li
            key={step.id}
            className={cn(
              "flex gap-3 py-3.5 transition-opacity",
              status === "pending" && "opacity-45",
            )}
          >
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium",
                MARK[status],
              )}
              aria-hidden="true"
            >
              {status === "succeeded" ? (
                <Check
                  size={13}
                  strokeWidth={3}
                />
              ) : status === "running" ? (
                <Loader2
                  size={13}
                  className={cn(
                    "motion-reduce:animate-none",
                    !stalled && "animate-spin",
                  )}
                />
              ) : status === "failed" ? (
                <X
                  size={13}
                  strokeWidth={3}
                />
              ) : status === "coverage_gap" || status === "not_wired" ? (
                <Minus
                  size={13}
                  strokeWidth={3}
                />
              ) : ordered ? (
                index + 1
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-[#0A1F4D] dark:text-white">
                {step.name}
              </p>
              {step.line && (
                <p
                  className={cn(
                    "mt-1 font-mono text-[10px] leading-relaxed break-words",
                    LINE[status],
                  )}
                >
                  {step.line}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
