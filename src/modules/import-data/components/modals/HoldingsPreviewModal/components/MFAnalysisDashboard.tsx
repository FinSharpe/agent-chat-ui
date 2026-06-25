"use client";
import type { MFPortfolioAnalytics } from "@/api/generated/mf-portfolio-apis/models";
import PerformanceScorePie from "@/modules/core/portfolio/mf-portfolio/charts/PerformanceScorePie";
import RiskScorePie from "@/modules/core/portfolio/charts/RiskScorePie";
import { MFOverviewTab } from "@/modules/core/portfolio/mf-portfolio/components/tabs/MFOverviewTab";
import { CostAnalysisCard } from "@/modules/core/portfolio/mf-portfolio/components/CostAnalysisCard";
import { MFMissingHoldingsWarning } from "@/modules/core/portfolio/mf-portfolio/components/MFMissingHoldingsWarning";
import { WorkspaceReturnsChart } from "./WorkspaceReturnsChart";
import { AnalysisCard } from "./AnalysisCard";

/**
 * Flat MF/ETF analysis canvas. Leads with cumulative returns and the
 * Performance + Risk score gauges, then SEBI-category allocation and cost.
 */
export function MFAnalysisDashboard({
  analytics,
  showMissingHoldingsWarning = true,
}: {
  analytics: MFPortfolioAnalytics;
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
          <MFMissingHoldingsWarning
            missingHoldings={analytics.missing_holdings}
          />
        )}

      {allMissing ? (
        <div className="border-border bg-card text-text-tertiary rounded-xl border p-6 text-center text-sm">
          None of these schemes could be matched for analysis. Adjust the ledger
          and re-run.
        </div>
      ) : (
        <>
          <WorkspaceReturnsChart data={analytics.returns_chart_data} />

          <div className="grid grid-cols-1 gap-4 @min-[480px]/canvas:grid-cols-2">
            <AnalysisCard
              title="Performance Score"
              hint="vs peers"
            >
              <PerformanceScorePie
                data={analytics.performance_score_chart_data}
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

          <MFOverviewTab
            categoryWiseAllocations={analytics.category_wise_allocations}
          />

          <CostAnalysisCard costAnalysis={analytics.cost_analysis} />
        </>
      )}
    </div>
  );
}
