"use client";
import type { ComponentType } from "react";
import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import {
  Badge,
  ChartSkeleton,
  DataPanel,
  Notice,
  ScoreRing,
} from "@/modules/import-data/components/shared/ui";
import type { AnalyticsPanelProps } from "./analytics-panel.types";

/** Shape every per-asset analytics hook must expose. */
type UseAnalytics<A, H> = () => {
  analytics: A | null | undefined;
  isAnalyzing: boolean;
  analyzePortfolio: (holdings: H[]) => void;
  reset: () => void;
  /** The last run errored or came back without data. */
  failed?: boolean;
  /** The mutation's error (an Error, or the API's validation payload). */
  error?: unknown;
};

/** Results component that renders the analytics payload. */
type Results<A> = ComponentType<{
  analytics: A;
  showMissingHoldingsWarning?: boolean;
  onRerun?: () => void;
  isRerunning?: boolean;
}>;

const FACETS = [
  "Cumulative returns",
  "FinSharpe & risk scores",
  "Allocation",
  "Risk flags",
];

/**
 * Build the analysis section for an asset class. Before a run it's a single
 * card inviting the user to run the one-year analysis; while running, card
 * skeletons in the dashboard's shape; with results, the reference analysis
 * cards (score, returns, allocation…) rendered straight into the modal column.
 * Editing the ledger (adding or removing a holding) clears stale results.
 */
export function createAnalyticsPanel<A, H>(
  useAnalytics: UseAnalytics<A, H>,
  ResultsView: Results<A>,
) {
  return function AnalyticsPanel({
    holdingsCount,
    getHoldings,
  }: AnalyticsPanelProps) {
    const { analytics, isAnalyzing, analyzePortfolio, reset, failed, error } =
      useAnalytics();

    // Clear stale analytics when holdings change (add/remove).
    const prevCount = useRef(holdingsCount);
    useEffect(() => {
      if (prevCount.current !== holdingsCount && analytics) reset();
      prevCount.current = holdingsCount;
    }, [holdingsCount, analytics, reset]);

    const runAnalysis = () => analyzePortfolio(getHoldings() as unknown as H[]);

    if (analytics) {
      return (
        <ResultsView
          analytics={analytics}
          showMissingHoldingsWarning
          onRerun={runAnalysis}
          isRerunning={isAnalyzing}
        />
      );
    }

    if (isAnalyzing) {
      return (
        <>
          <DataPanel
            title="FinSharpe Portfolio Score"
            bodyClassName="flex items-center gap-5"
          >
            <div className="animate-pulse">
              <ScoreRing value={null} />
            </div>
            <div className="flex-1 space-y-1 text-[11px]">
              <p className="text-forest-deep font-medium dark:text-white">
                Analysing your portfolio…
              </p>
              <p className="text-[10px] leading-relaxed text-slate-400">
                Computing one-year returns, scores and allocation across your
                holdings.
              </p>
            </div>
          </DataPanel>
          <ChartSkeleton height={150} />
        </>
      );
    }

    return (
      <DataPanel
        title="Portfolio Analysis"
        icon={Sparkles}
        bodyClassName="space-y-4"
      >
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          Run a one-year analysis for cumulative returns against the benchmark,
          your FinSharpe &amp; risk scores and allocation — recomputed whenever
          you edit the holdings below.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {FACETS.map((f) => (
            <Badge key={f}>{f}</Badge>
          ))}
        </div>
        {failed && (
          <Notice tone="danger">
            The analysis couldn&apos;t run
            {error instanceof Error ? ` (${error.message})` : ""}. Check the
            holdings and try again.
          </Notice>
        )}
        <button
          type="button"
          onClick={runAnalysis}
          disabled={holdingsCount === 0}
          className="bg-brand-gradient flex w-full items-center justify-center gap-1.5 rounded-full py-3 text-xs font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-98 disabled:pointer-events-none disabled:opacity-40"
        >
          <Sparkles size={13} />
          {failed ? "Try Again" : "Run Analysis"}
        </button>
      </DataPanel>
    );
  };
}
