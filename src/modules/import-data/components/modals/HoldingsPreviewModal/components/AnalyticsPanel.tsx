"use client";
import type { ComponentType } from "react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { BarChart3, Loader2 } from "lucide-react";
import type { AnalyticsPanelProps } from "./analytics-panel.types";

/** Shape every per-asset analytics hook must expose. */
type UseAnalytics<A, H> = () => {
  analytics: A | null | undefined;
  isAnalyzing: boolean;
  analyzePortfolio: (holdings: H[]) => void;
  reset: () => void;
};

/** Results component that renders the analytics payload. */
type ResultsTabs<A> = ComponentType<{
  analytics: A;
  showMissingHoldingsWarning?: boolean;
}>;

/**
 * Build an "Analyze Portfolio" panel (button + results) for an asset class.
 * Each asset only differs by its analytics hook and results component, so the
 * button JSX, loading states, and stale-reset effect live here once instead of
 * being copy-pasted per asset.
 */
export function createAnalyticsPanel<A, H>(
  useAnalytics: UseAnalytics<A, H>,
  Results: ResultsTabs<A>,
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

    return (
      <>
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => analyzePortfolio(getHoldings() as unknown as H[])}
            disabled={holdingsCount === 0 || isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Analyze Portfolio
              </>
            )}
          </Button>
        </div>

        {analytics && (
          <div className="border rounded-lg bg-background">
            <Results analytics={analytics} showMissingHoldingsWarning={true} />
          </div>
        )}
      </>
    );
  };
}
