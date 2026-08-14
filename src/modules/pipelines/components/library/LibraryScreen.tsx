"use client";

import Link from "next/link";
import { Link2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  formatTimestamp,
  RUN_STATUS_LABEL,
  stanceTone,
} from "../../constants/presentation";
import { researchRoutes } from "../../constants/routes";
import {
  useOwnedReports,
  useShareActions,
} from "../../hooks/usePipelineQueries";
import type { OwnedPurchase } from "../../types/pipelines.types";
import { targetSymbol } from "../../utils/report";
import { ResearchShell } from "../shared/ResearchShell";

/**
 * The reports a user owns.
 *
 * The row unit is the **Purchase**, because that is the only user-scoped
 * record — two purchases can attach to one content-keyed Run, and a Run has no
 * owner. Every state shows and is labelled: a published row opens its report,
 * an in-flight row deep-links back into the run screen the user lost, and a
 * refunded row stays as history rather than vanishing along with the evidence
 * of what happened.
 */

function rowHref(row: OwnedPurchase): string {
  return row.run_status === "published"
    ? researchRoutes.report(row.run_id)
    : // The run status carries no target, so the row hands the symbol over —
      // otherwise a run reached from this list loses the name of the stock it
      // is about.
      researchRoutes.run(row.run_id, targetSymbol(row.target));
}

function StateChip({ row }: { row: OwnedPurchase }) {
  if (row.refunded) {
    return (
      <span className="border-border-default bg-bg-subtle text-text-secondary rounded-full border px-2.5 py-1 text-xs">
        Refunded
      </span>
    );
  }
  if (row.run_status === "published" && row.stance) {
    const tone = stanceTone(row.stance.value);
    return (
      <span
        className={cn(
          "rounded-full border px-2.5 py-1 text-xs font-medium",
          tone.chip,
        )}
      >
        {row.stance.label}
      </span>
    );
  }
  return (
    <span className="border-border-default bg-bg-subtle text-text-secondary rounded-full border px-2.5 py-1 text-xs">
      {RUN_STATUS_LABEL[row.run_status] ?? row.run_status}
    </span>
  );
}

function PurchaseRow({ row }: { row: OwnedPurchase }) {
  const { remove } = useShareActions();
  const symbol = targetSymbol(row.target);

  return (
    <li className="border-border-default bg-bg-card flex flex-wrap items-center gap-3 rounded-xl border px-5 py-4">
      <Link
        href={rowHref(row)}
        className="group min-w-0 flex-1"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-text-primary font-medium group-hover:underline">
            {symbol || "Unknown target"}
          </span>
          <span className="text-text-secondary text-sm">
            {row.pipeline_name || row.pipeline_id}
          </span>
        </div>
        <p className="text-text-tertiary mt-1 text-xs">
          {row.published_at
            ? `Published ${formatTimestamp(row.published_at)}`
            : `Bought ${formatTimestamp(row.created_at)}`}
          {row.degraded && " · incomplete"}
        </p>
      </Link>

      <div className="flex shrink-0 items-center gap-2">
        {row.shared && (
          <span
            className="text-text-tertiary flex items-center gap-1 text-xs"
            title="A public share link is live for this report"
          >
            <Link2 className="size-3.5" />
            Shared
          </span>
        )}
        <StateChip row={row} />
        <ConfirmDialog
          title="Remove from your reports?"
          description={
            row.shared
              ? "This hides the report from this list. Its public share link will stop working — there is no other place to revoke it from. No credits are returned."
              : "This hides the report from this list. No credits are returned."
          }
          confirmLabel="Remove"
          destructive
          onConfirm={async () => {
            try {
              await remove.mutateAsync(row.purchase_id);
            } catch {
              toast.error("The report could not be removed.");
              throw new Error("remove failed");
            }
          }}
        >
          {(_, setOpen) => (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${symbol} report`}
              onClick={() => setOpen(true)}
            >
              {remove.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </Button>
          )}
        </ConfirmDialog>
      </div>
    </li>
  );
}

export function LibraryScreen() {
  const { data, isLoading, error } = useOwnedReports();

  return (
    <ResearchShell
      title="Your reports"
      subtitle="Everything you have commissioned, including runs still in progress."
      backHref={researchRoutes.catalog}
      backLabel="Research Reports"
      actions={
        <Button
          asChild
          size="sm"
        >
          <Link href={researchRoutes.catalog}>New report</Link>
        </Button>
      }
    >
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      )}

      {error && (
        <p className="border-error-border bg-error-bg text-error-fg rounded-lg border px-4 py-3 text-sm">
          Your reports could not be loaded.
        </p>
      )}

      {data && data.length === 0 && (
        <div className="border-border-default bg-bg-card rounded-xl border px-6 py-12 text-center">
          <p className="text-text-secondary text-sm">
            You have not commissioned a report yet.
          </p>
          <Button
            asChild
            className="mt-4"
          >
            <Link href={researchRoutes.catalog}>Browse research reports</Link>
          </Button>
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((row) => (
            <PurchaseRow
              key={row.purchase_id}
              row={row}
            />
          ))}
        </ul>
      )}
    </ResearchShell>
  );
}
