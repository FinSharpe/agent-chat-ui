"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Bell, Loader2, RefreshCw } from "lucide-react";

import FeatureHeader from "@/components/discover/FeatureHeader";
import SectionErrorState from "@/components/shared/SectionErrorState";
import { cn } from "@/lib/utils";
import {
  RUN_STATUS_LABEL,
  STEP_ABSENCE_LINE,
} from "../../constants/presentation";
import { researchRoutes } from "../../constants/routes";
import {
  useOwnedReports,
  usePipelineCatalog,
  usePipelineRun,
} from "../../hooks/usePipelineQueries";
import { useRunCompletionNotification } from "../../hooks/useRunCompletionNotification";
import { runErrorCopy } from "../../utils/errors";
import { stepsAreOrdered, targetLabel } from "../../utils/target";
import {
  ActionBar,
  CIRCLE_BUTTON,
  PRIMARY_BUTTON,
  Placeholder,
  SCROLL_BODY,
} from "../shared/kit";
import { PipelineSteps, type StepRow } from "../shared/PipelineSteps";
import { ProgressBlock } from "../shared/ProgressBlock";
import { RunOutcome } from "./RunOutcome";

const SETTLED = ["succeeded", "failed", "coverage_gap", "not_wired"];

/**
 * Watching a report being produced — the reference run view, driven by the
 * real run status: the bar fills as Steps settle, the Step being worked on
 * spins, finished Steps show their headline, and the completion block opens
 * the published report.
 *
 * The run does not depend on this screen: closing it does not cancel it, and
 * the report is waiting in Your Reports afterwards. The screen says so,
 * because a progress bar with no such promise invites people to sit and stare
 * at it.
 */
export function RunScreen({
  runId,
  label = "",
}: {
  runId: string;
  /** What the page is about — a ticker, or the market. Only ever a label. */
  label?: string;
}) {
  const router = useRouter();
  const {
    data: run,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = usePipelineRun(runId);
  // The run status carries neither a target nor a Pipeline, so both are read
  // off the Purchase that owns this Run — already cached. The URL label
  // stands in until it lands.
  const { data: owned } = useOwnedReports();
  const { data: catalog } = usePipelineCatalog();
  const purchase = owned?.find((row) => row.run_id === runId);
  const entry = catalog?.find((item) => item.id === purchase?.pipeline_id);
  const about = label || targetLabel(purchase?.target);
  const ordered = stepsAreOrdered(entry);

  const notification = useRunCompletionNotification({
    runId,
    status: run?.status,
    subject: about || "Your",
    href: researchRoutes.report(runId),
  });

  const { steps, done } = useMemo(() => {
    // A gap declared at quote time is authoritative: the Step is never
    // scheduled, so it can still read "pending" on the wire.
    const gaps = new Set(run?.coverage_gaps ?? []);
    const rows: StepRow[] = (run?.steps ?? []).map((step) => {
      const status = gaps.has(step.step_id) ? "coverage_gap" : step.status;
      return {
        id: step.step_id,
        name: step.title || step.step_id,
        status,
        line: step.headline || STEP_ABSENCE_LINE[status],
      };
    });
    return {
      steps: rows,
      done: rows.filter((row) => SETTLED.includes(row.status)).length,
    };
  }, [run]);

  const isRunning = run?.status === "queued" || run?.status === "running";

  /**
   * The run dying and the *connection* dying are different events, and the
   * screen has to name which one happened.
   *
   * A failed run is terminal and arrives as `status: "failed"` — RunOutcome
   * shows it, with the refund. This is the other one: the poll could not reach
   * the server, so the last status we hold is still "running" and everything
   * below it is frozen at whatever it said then. Left alone it would be a
   * progress bar that never moves and a spinner that never stops, which reads
   * as a run that has hung.
   */
  const lostContact = isError && !!run && isRunning;
  const runCopy = runErrorCopy(error);

  const statusLabel = lostContact
    ? "Not connected"
    : run
      ? (RUN_STATUS_LABEL[run.status] ?? run.status)
      : "";
  const title = entry?.name ?? purchase?.pipeline_name ?? "Agent workflow";
  const subtitle = [about, statusLabel].filter(Boolean).join(" · ");

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      <FeatureHeader
        title={title}
        subtitle={subtitle || undefined}
        onBack={() => router.push(researchRoutes.catalog)}
        right={
          isRunning && notification.canAsk ? (
            <button
              type="button"
              onClick={notification.enable}
              className={CIRCLE_BUTTON}
              title="Notify me when it's ready"
              aria-label="Notify me when it's ready"
            >
              <Bell size={14} />
            </button>
          ) : undefined
        }
      />

      <div className={`${SCROLL_BODY} space-y-5`}>
        {isLoading && (
          <div className="space-y-3">
            <Placeholder className="h-3 w-32" />
            <Placeholder className="h-2 w-full" />
            <Placeholder className="h-48 w-full" />
          </div>
        )}

        {/* Nothing ever arrived: there is no progress to qualify, only a
            reason. */}
        {isError && !run && (
          <SectionErrorState
            title={runCopy.title}
            description={runCopy.description}
            onRetry={runCopy.retryable ? () => refetch() : undefined}
            retrying={isFetching}
          />
        )}

        {lostContact && (
          <SectionErrorState
            compact
            title="Lost contact with the server — the progress below has stopped updating"
            onRetry={() => refetch()}
            retrying={isFetching}
          />
        )}

        {run && (
          <>
            <ProgressBlock
              done={done}
              total={steps.length}
              note={
                lostContact
                  ? "This is where the run had got to when we last reached the server. The run itself carries on without this screen — we keep trying, and the report will be waiting in Your Reports either way."
                  : isRunning
                    ? `${
                        ordered
                          ? "Each step narrows the one before it, so they finish in order."
                          : "Sections are fetched and written in parallel, so they finish out of order."
                      } You can leave — the run keeps going, and the report will be waiting in Your Reports.`
                    : undefined
              }
            />

            <PipelineSteps
              steps={steps}
              ordered={ordered}
              stalled={lostContact}
            />

            {!isRunning && (
              <RunOutcome
                run={run}
                total={steps.length}
                onOpenReport={() => router.push(researchRoutes.report(runId))}
                onLibrary={() => router.push(researchRoutes.library)}
                onCatalog={() => router.push(researchRoutes.catalog)}
              />
            )}

            <p className="text-[10px] text-slate-400">Run reference {runId}</p>
          </>
        )}
      </div>

      {/* While we are out of contact the bar stops asserting "Running…" and
          becomes the way back — a live button, not a spinner to watch. */}
      {lostContact && (
        <ActionBar>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className={cn(PRIMARY_BUTTON, "disabled:opacity-70")}
          >
            {isFetching ? (
              <Loader2
                size={15}
                className="animate-spin motion-reduce:animate-none"
              />
            ) : (
              <RefreshCw size={15} />
            )}
            {isFetching ? "Reconnecting…" : "Reconnect"}
          </button>
        </ActionBar>
      )}

      {!lostContact && (isLoading || isRunning) && (
        <ActionBar>
          <button
            type="button"
            disabled
            className={cn(PRIMARY_BUTTON, "disabled:opacity-70")}
          >
            <Loader2
              size={15}
              className="animate-spin"
            />
            {run?.status === "queued" ? "Queued…" : "Running…"}
          </button>
        </ActionBar>
      )}
    </div>
  );
}
