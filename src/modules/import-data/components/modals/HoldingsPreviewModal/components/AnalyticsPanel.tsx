"use client";
import type { ComponentType } from "react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import {
  WorkspaceCanvasEmpty,
  WorkspaceCanvasLoading,
} from "@/modules/import-data/components/shared/ui";
import type { AnalyticsPanelProps } from "./analytics-panel.types";

/** Shape every per-asset analytics hook must expose. */
type UseAnalytics<A, H> = () => {
  analytics: A | null | undefined;
  isAnalyzing: boolean;
  analyzePortfolio: (holdings: H[]) => void;
  reset: () => void;
};

/** Results component that renders the analytics payload. */
type Results<A> = ComponentType<{
  analytics: A;
  showMissingHoldingsWarning?: boolean;
}>;

const EMPTY_CHIPS = [
  "Cumulative returns",
  "FinSharpe & risk scores",
  "Allocation",
];

/**
 * Build the right-hand "analysis canvas" for an asset class. Curate state shows
 * an inviting empty prompt + Run CTA; running shows a loader; results render the
 * flat dashboard (returns + scores + allocation) promoted to the front. The
 * panel fills its column so the canvas reads as a co-equal half of the
 * workspace — not an afterthought stacked under a table.
 */
export function createAnalyticsPanel<A, H>(
  useAnalytics: UseAnalytics<A, H>,
  ResultsView: Results<A>,
) {
  return function AnalyticsPanel({
    holdingsCount,
    getHoldings,
  }: AnalyticsPanelProps) {
    const { analytics, isAnalyzing, analyzePortfolio, reset } = useAnalytics();

    // Clear stale analytics when holdings change (add/remove).
    const prevCount = useRef(holdingsCount);
    useEffect(() => {
      if (prevCount.current !== holdingsCount && analytics) reset();
      prevCount.current = holdingsCount;
    }, [holdingsCount, analytics, reset]);

    const runAnalysis = () => analyzePortfolio(getHoldings() as unknown as H[]);

    if (analytics) {
      return (
        <div className="flex h-full min-h-0 flex-col">
          <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
            <span className="text-text-muted text-xs">
              1-year analysis · live
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={runAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Re-run
            </Button>
          </div>
          <div className="scrollbar-thin animate-fade-in-up -mr-1.5 min-h-0 flex-1 overflow-y-auto pr-1.5">
            <ResultsView
              analytics={analytics}
              showMissingHoldingsWarning
            />
          </div>
        </div>
      );
    }

    return (
      <div className="border-border bg-card/40 flex h-full min-h-0 rounded-xl border border-dashed">
        {isAnalyzing ? (
          <WorkspaceCanvasLoading hint="Computing returns, scores and allocation across your holdings" />
        ) : (
          <WorkspaceCanvasEmpty
            title="Reveal your portfolio's shape"
            description="Run a one-year analysis for cumulative returns vs Nifty 500, your FinSharpe & risk scores, and allocation — recomputed whenever you edit the ledger."
            chips={EMPTY_CHIPS}
            action={
              <Button
                type="button"
                onClick={runAnalysis}
                disabled={holdingsCount === 0 || isAnalyzing}
                className="from-primary to-brand-teal gap-2 bg-gradient-to-r text-white shadow-[0_14px_34px_-14px_rgba(37,99,235,0.8)] hover:opacity-95"
              >
                <Sparkles className="h-4 w-4" />
                Run Analysis
              </Button>
            }
          />
        )}
      </div>
    );
  };
}
