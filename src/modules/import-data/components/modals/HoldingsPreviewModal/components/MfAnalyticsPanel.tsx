"use client";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MFPortfolioAnalyticsTabs } from "@/modules/core/portfolio/mf-portfolio/components/MFPortfolioAnalyticsTabs";
import { BarChart3, Loader2 } from "lucide-react";
import { MutualFundHoldingWithQuantity } from "@/modules/import-data/types/mutual-funds";
import { useMutualFundsAnalytics } from "../../MutualFundsPreviewModal/hooks/useMutualFundsAnalytics";
import type { AnalyticsPanelProps } from "./analytics-panel.types";

/**
 * "Analyze Portfolio" panel backed by the MF Portfolio Analytics API. Used by
 * both Mutual Funds and ETF (the API works on isin + quantity).
 */
export function MfAnalyticsPanel({
  holdingsCount,
  getHoldings,
}: AnalyticsPanelProps) {
  const { analytics, isAnalyzing, analyzePortfolio, reset } =
    useMutualFundsAnalytics();

  // Clear stale analytics when holdings change (add/remove)
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
          onClick={() =>
            analyzePortfolio(
              getHoldings() as unknown as MutualFundHoldingWithQuantity[],
            )
          }
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
          <MFPortfolioAnalyticsTabs
            analytics={analytics}
            showMissingHoldingsWarning={true}
          />
        </div>
      )}
    </>
  );
}
