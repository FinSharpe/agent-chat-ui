"use client";

import { ArrowLeft, ArrowRight, Check, Library, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { RunStatusResponse } from "../../types/pipelines.types";
import { PRIMARY_BUTTON, QUIET_BUTTON } from "../shared/kit";

/**
 * The block a finished run ends on — the reference's "Workflow Complete"
 * section, with the way into the real report. A failed or cancelled run ends
 * on its refund instead: nothing partial is ever published.
 */
export function RunOutcome({
  run,
  total,
  onOpenReport,
  onLibrary,
  onCatalog,
}: {
  run: RunStatusResponse;
  total: number;
  onOpenReport: () => void;
  onLibrary: () => void;
  onCatalog: () => void;
}) {
  const published = run.status === "published";
  const produced = (run.steps ?? []).filter(
    (step) => step.status === "succeeded",
  ).length;

  const title = published
    ? "Workflow Complete"
    : run.status === "failed"
      ? "Report Could Not Be Produced"
      : "Run Cancelled";
  const detail = published
    ? run.degraded
      ? `${produced} of ${total} sections produced — every missing one is marked in the report`
      : `All ${total} agent steps executed successfully`
    : "Your credits have been refunded. Nothing partial was published.";

  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            published
              ? "bg-[#97edcc]/30 text-[#0A9E6E]"
              : "bg-rose-50 text-rose-500 dark:bg-rose-500/15"
          }`}
        >
          {published ? (
            <Check
              size={16}
              strokeWidth={3}
            />
          ) : (
            <X
              size={16}
              strokeWidth={3}
            />
          )}
        </div>
        <div>
          <p className="text-[12px] font-medium text-[#0A1F4D] dark:text-white">
            {title}
          </p>
          <p className="text-[10px] text-slate-400">{detail}</p>
        </div>
      </div>

      {published ? (
        <button
          type="button"
          onClick={onOpenReport}
          className={cn(PRIMARY_BUTTON, "py-3 text-[11px]")}
        >
          Open Full Report <ArrowRight size={13} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onCatalog}
          className={cn(PRIMARY_BUTTON, "py-3 text-[11px]")}
        >
          <ArrowLeft size={13} /> Back to Agent Workflows
        </button>
      )}
      <button
        type="button"
        onClick={onLibrary}
        className={QUIET_BUTTON}
      >
        <Library size={12} /> Your Reports
      </button>
    </div>
  );
}
