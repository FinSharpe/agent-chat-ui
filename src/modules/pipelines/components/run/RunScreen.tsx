"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Bell, CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PipelineApiError } from "../../api/pipelines-client";
import { RUN_STATUS_LABEL } from "../../constants/presentation";
import { researchRoutes } from "../../constants/routes";
import { usePipelineRun } from "../../hooks/usePipelineQueries";
import { useRunCompletionNotification } from "../../hooks/useRunCompletionNotification";
import { ResearchShell } from "../shared/ResearchShell";
import { RunTimeline } from "./RunTimeline";

/**
 * Watching a report being produced.
 *
 * The run does not depend on this screen: closing the tab does not cancel it,
 * and the report is waiting in Your reports afterwards. The screen says so,
 * because a progress bar with no such promise invites people to sit and stare
 * at it.
 */
export function RunScreen({
  runId,
  symbol = "",
}: {
  runId: string;
  symbol?: string;
}) {
  const { data: run, isLoading, error } = usePipelineRun(runId);

  const notification = useRunCompletionNotification({
    runId,
    status: run?.status,
    symbol: symbol || "Your",
    href: researchRoutes.report(runId),
  });

  const { done, total } = useMemo(() => {
    const steps = run?.steps ?? [];
    return {
      // every terminal state, not just the successful one — a step that was
      // never scheduled (out of coverage, or not built yet) is as settled as
      // one that ran, and leaving it out strands the counter short of total
      done: steps.filter((step) =>
        ["succeeded", "failed", "coverage_gap", "not_wired"].includes(
          step.status,
        ),
      ).length,
      total: steps.length,
    };
  }, [run]);

  const isRunning = run?.status === "queued" || run?.status === "running";

  return (
    <ResearchShell
      title={symbol ? `${symbol} research report` : "Research report"}
      subtitle={
        run ? (
          <span>
            {RUN_STATUS_LABEL[run.status] ?? run.status}
            {total > 0 && ` · ${done} of ${total} sections done`}
          </span>
        ) : undefined
      }
      backHref={researchRoutes.library}
      backLabel="Your reports"
      actions={
        isRunning && notification.canAsk ? (
          <Button
            variant="outline"
            size="sm"
            onClick={notification.enable}
          >
            <Bell className="size-4" />
            Notify me when it&apos;s ready
          </Button>
        ) : null
      }
    >
      {isLoading && <Skeleton className="h-72 w-full rounded-xl" />}

      {error && (
        <p className="border-error-border bg-error-bg text-error-fg rounded-lg border px-4 py-3 text-sm">
          {error instanceof PipelineApiError && error.isNotFound
            ? "This run is not one of yours, or no longer exists."
            : "The run status could not be loaded."}
        </p>
      )}

      {run && (
        <div className="space-y-4">
          {run.status === "published" && (
            <div className="border-success-border bg-success-bg flex flex-wrap items-center justify-between gap-4 rounded-lg border px-4 py-3">
              <p className="text-success-fg flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="size-4" />
                {run.degraded
                  ? "Your report is ready, with some sections missing."
                  : "Your report is ready."}
              </p>
              <Button
                asChild
                size="sm"
              >
                <Link href={researchRoutes.report(runId)}>Read the report</Link>
              </Button>
            </div>
          )}

          {(run.status === "failed" || run.status === "cancelled") && (
            <div className="border-error-border bg-error-bg text-error-fg rounded-lg border px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-medium">
                <XCircle className="size-4" />
                {run.status === "failed"
                  ? "This report could not be produced."
                  : "This run was cancelled."}
              </p>
              <p className="mt-1 text-sm">
                Your credits have been refunded. Nothing partial was published.
              </p>
            </div>
          )}

          {isRunning && (
            <div className="border-border-default bg-bg-subtle text-text-secondary flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
              <Loader2 className="text-primary mt-0.5 size-4 shrink-0 animate-spin motion-reduce:animate-none" />
              <p>
                Sections are fetched and written in parallel, so they finish out
                of order. You can leave this page — the run keeps going, and the
                report will be waiting in{" "}
                <Link
                  href={researchRoutes.library}
                  className="underline underline-offset-2"
                >
                  Your reports
                </Link>
                .
              </p>
            </div>
          )}

          <RunTimeline
            steps={run.steps ?? []}
            coverageGaps={run.coverage_gaps ?? []}
          />

          <p className="text-text-tertiary text-xs">Run reference {runId}</p>
        </div>
      )}
    </ResearchShell>
  );
}
