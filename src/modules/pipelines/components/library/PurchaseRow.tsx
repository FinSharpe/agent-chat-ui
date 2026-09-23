"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock, Link2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  formatTimestamp,
  RUN_STATUS_LABEL,
} from "../../constants/presentation";
import { researchRoutes } from "../../constants/routes";
import { useShareActions } from "../../hooks/usePipelineQueries";
import type { OwnedPurchase } from "../../types/pipelines.types";
import { targetLabel } from "../../utils/target";
import { CIRCLE_BUTTON, Chip, type ChipTone } from "../shared/kit";

function rowHref(row: OwnedPurchase): string {
  return row.run_status === "published"
    ? researchRoutes.report(row.run_id)
    : // The run status carries no target, so the row hands the label over —
      // otherwise a run reached from this list loses the name of what it is
      // about.
      researchRoutes.run(row.run_id, targetLabel(row.target));
}

/** A verdict is never a green "buy" or a red "sell": constructive gets the
 *  brand mint, cautious the warning amber, anything else stays brand blue. */
const STANCE_CHIP: Record<string, ChipTone> = {
  constructive: "mint",
  cautious: "amber",
};

function StateChip({ row }: { row: OwnedPurchase }) {
  if (row.refunded) return <Chip tone="slate">Refunded</Chip>;
  if (row.run_status === "published" && row.stance) {
    return (
      <Chip tone={STANCE_CHIP[row.stance.value] ?? "blue"}>
        {row.stance.label}
      </Chip>
    );
  }
  const tone: ChipTone =
    row.run_status === "failed" || row.run_status === "cancelled"
      ? "rose"
      : row.run_status === "published"
        ? "mint"
        : "amber";
  return (
    <Chip tone={tone}>
      {(row.run_status === "running" || row.run_status === "queued") && (
        <Loader2
          size={9}
          className="animate-spin motion-reduce:animate-none"
        />
      )}
      {RUN_STATUS_LABEL[row.run_status] ?? row.run_status}
    </Chip>
  );
}

/**
 * One owned report: its Pipeline and state as chips, what it is about, when
 * it landed — and a remove button beside it, confirmed first because a live
 * share link dies with the row.
 */
export function PurchaseRow({ row }: { row: OwnedPurchase }) {
  const { remove } = useShareActions();
  const [confirming, setConfirming] = useState(false);
  // A market Run has no ticker, so the row names the market. Falling all the
  // way through to the Pipeline is for a target this build cannot read at all.
  const about =
    targetLabel(row.target) || row.pipeline_name || "Unknown target";

  async function onRemove() {
    try {
      await remove.mutateAsync(row.purchase_id);
      setConfirming(false);
    } catch {
      toast.error("The report could not be removed.");
    }
  }

  return (
    <div className="flex items-center gap-3 p-4.5">
      <Link
        href={rowHref(row)}
        className="group min-w-0 flex-1 space-y-2.5"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone="blue">{row.pipeline_name || row.pipeline_id}</Chip>
          <StateChip row={row} />
          {row.shared && (
            <span title="A public share link is live for this report">
              <Chip tone="slate">
                <Link2 size={9} />
                Shared
              </Chip>
            </span>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="font-geist text-[13px] leading-snug font-medium text-[#0A1F4D] transition-colors group-hover:text-[#063BAA] dark:text-white">
            {about}
          </h3>
          <p className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock size={11} />
            {row.published_at
              ? `Published ${formatTimestamp(row.published_at)}`
              : `Bought ${formatTimestamp(row.created_at)}`}
            {row.degraded && " · incomplete"}
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={cn(CIRCLE_BUTTON, "hover:text-rose-500")}
        aria-label={`Remove ${about} report`}
        title="Remove from Your Reports"
      >
        <Trash2 size={14} />
      </button>

      <Dialog
        open={confirming}
        onOpenChange={(next) => {
          if (!remove.isPending) setConfirming(next);
        }}
      >
        <DialogContent className="rounded-card font-funnel gap-5 border-slate-100 p-6 sm:max-w-md">
          <DialogHeader className="gap-1.5">
            <DialogTitle className="font-geist text-sm font-medium text-[#0A1F4D] dark:text-white">
              Remove from your reports?
            </DialogTitle>
            <DialogDescription className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              {row.shared
                ? "This hides the report from this list. Its public share link will stop working — there is no other place to revoke it from. No credits are returned."
                : "This hides the report from this list. No credits are returned."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={remove.isPending}
              className="flex-1 rounded-full bg-[#DFF9EF] py-3 text-[11px] font-medium tracking-wide text-[#0A1F4D] uppercase transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={remove.isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-rose-500 py-3 text-[11px] font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 disabled:opacity-60"
            >
              {remove.isPending && (
                <Loader2
                  size={13}
                  className="animate-spin"
                />
              )}
              Remove
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
