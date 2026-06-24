"use client";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PortfolioAnalyticsTabs } from "@/modules/core/portfolio/components/PortfolioAnalyticsTabs";
import { BarChart3, Loader2 } from "lucide-react";
import { EquityHoldingWithQuantity } from "@/modules/import-data/types/equities";
import { useEquitiesAnalytics } from "../../EquitiesPreviewModal/hooks/useEquitiesAnalytics";
import type { AnalyticsPanelProps } from "./analytics-panel.types";

/**
 * "Analyze Portfolio" panel for equity holdings (Portfolio Analytics API).
 */
export function EquitiesAnalyticsPanel({
  holdingsCount,
  getHoldings,
}: AnalyticsPanelProps) {
  const { analytics, isAnalyzing, analyzePortfolio, reset } =
    useEquitiesAnalytics();

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
            analyzePortfolio(getHoldings() as EquityHoldingWithQuantity[])
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
          <PortfolioAnalyticsTabs
            analytics={analytics}
            showMissingHoldingsWarning={true}
          />
        </div>
      )}
    </>
  );
}
