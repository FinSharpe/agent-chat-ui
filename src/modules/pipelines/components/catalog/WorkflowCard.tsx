"use client";

import { Play, Workflow } from "lucide-react";

// By file path, not "@/modules/credits": the barrel carries the Credits page.
import { priceLabel } from "@/modules/credits/utils/format";
import { pipelineKindLabel } from "../../constants/presentation";
import type { CatalogEntry } from "../../types/pipelines.types";
import { stepsAreOrdered } from "../../utils/target";
import { Chip } from "../shared/kit";

/**
 * One Pipeline as a reference workflow row: kind and price chips, the name
 * and what it covers, then the step count and a Run button.
 *
 * The Steps themselves are not listed here — like the reference, the
 * itemised preview lives on the run screen, where the reader is deciding
 * whether to pay for them.
 */
export function WorkflowCard({
  entry,
  onRun,
}: {
  entry: CatalogEntry;
  onRun: () => void;
}) {
  const stepCount = entry.steps?.length ?? 0;
  const ordered = stepsAreOrdered(entry);

  return (
    <div className="space-y-2.5 p-4.5">
      <div className="flex items-center gap-1.5">
        <Chip tone="blue">{pipelineKindLabel(entry.target_kind)}</Chip>
        <Chip tone="amber">{priceLabel(entry.price_minor)}</Chip>
      </div>
      <div className="space-y-1">
        <h3 className="font-geist text-[13px] leading-snug font-medium text-[#0A1F4D] dark:text-white">
          {entry.name}
        </h3>
        <p className="line-clamp-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
          {entry.description}
        </p>
      </div>
      <div className="flex items-center justify-between pt-0.5">
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <Workflow size={11} />
          {stepCount} steps · {ordered ? "run in sequence" : "run in parallel"}
        </span>
        <button
          type="button"
          onClick={onRun}
          aria-label={`Run ${entry.name}`}
          className="bg-brand-gradient flex items-center gap-2 rounded-full py-1.5 pr-1.5 pl-3.5 text-[10.5px] font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-95"
        >
          Run
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Play
              size={10}
              fill="currentColor"
            />
          </span>
        </button>
      </div>
    </div>
  );
}
