"use client";
import type { PortfolioAnalytics } from "@/api/generated/strategy-apis/models";
import OverallScorePie from "@/modules/core/portfolio/charts/OverallScorePie";
import RiskScorePie from "@/modules/core/portfolio/charts/RiskScorePie";
import { OverviewTab } from "@/modules/core/portfolio/components/tabs/OverviewTab";
import { MissingHoldingsWarning } from "@/modules/core/portfolio/components/MissingHoldingsWarning";
import { WorkspaceReturnsChart } from "./WorkspaceReturnsChart";
import { AnalysisCard } from "./AnalysisCard";

/**
 * Flat equity analysis canvas. Leads with cumulative returns and the FinSharpe
 * + Risk score gauges (promoted from a buried sub-tab), then allocation —
 * composing the existing, theme-aligned chart components.
 */
export function EquityAnalysisDashboard({
  analytics,
  showMissingHoldingsWarning = true,
}: {
  analytics: PortfolioAnalytics;
  showMissingHoldingsWarning?: boolean;
}) {
  const allMissing =
    !!analytics.missing_holdings &&
    !!analytics.holdings &&
    analytics.missing_holdings.length === analytics.holdings.length;

  return (
    <div className="space-y-4 [&_.mx-6]:mx-0 [&_.my-4]:my-0 [&_.pb-28]:pb-0">
      {showMissingHoldingsWarning &&
        analytics.missing_holdings &&
        analytics.missing_holdings.length > 0 &&
        !allMissing && (
          <MissingHoldingsWarning
            missingHoldings={analytics.missing_holdings}
          />
        )}

      {allMissing ? (
        <div className="border-border bg-card text-text-tertiary rounded-xl border p-6 text-center text-sm">
          None of these holdings could be matched for analysis. Adjust the
          ledger and re-run.
        </div>
      ) : (
        <>
          <WorkspaceReturnsChart data={analytics.returns_chart_data} />

          <div className="grid grid-cols-1 gap-4 @min-[480px]/canvas:grid-cols-2">
            <AnalysisCard
              title="FinSharpe Score"
              hint="0–100 · higher is better"
            >
              <OverallScorePie
                data={analytics.overall_score_chart_data}
                shouldRenderActiveShapeLabel
              />
            </AnalysisCard>
            <AnalysisCard
              title="Risk Score"
              hint="lower = safer"
            >
              <RiskScorePie
                data={analytics.risk_score_chart_data}
                shouldRenderActiveShapeLabel
              />
            </AnalysisCard>
          </div>

          <OverviewTab
            industryDistribution={analytics.industry_distribution}
            sizeDistribution={analytics.size_distribution}
            isLongShort={analytics.portfolio_type === "long_short"}
          />
        </>
      )}
    </div>
  );
}
