"use client";
import { PieChart, SearchX } from "lucide-react";
import type { MFPortfolioAnalytics } from "@/api/generated/mf-portfolio-apis/models";
import {
  DataPanel,
  DonutBreakdown,
  EmptyState,
  FlagList,
  Notice,
  type Flag,
} from "@/modules/import-data/components/shared/ui";
import type { DashboardProps } from "./EquityAnalysisDashboard";
import { CostCard } from "./analysis/CostCard";
import { FundDetailsCard } from "./analysis/FundDetailsCard";
import { ReturnsCard } from "./analysis/ReturnsCard";
import { ScoreCard, type ScoreBadge } from "./analysis/ScoreCard";
import { SnapshotCard } from "./analysis/SnapshotCard";
import {
  riskLabel,
  scoreValue,
  shortCategory,
  topSlice,
} from "./analysis/analysis-utils";

/**
 * Mutual fund / ETF analysis in the reference "Mutual Fund Analysis" layout:
 * score card, cumulative returns, category allocation donut, fund details,
 * cost and risk flags — all from the MF Portfolio Analytics API response.
 */
export function MFAnalysisDashboard({
  analytics,
  showMissingHoldingsWarning = true,
  onRerun,
  isRerunning,
}: DashboardProps<MFPortfolioAnalytics>) {
  const missing = analytics.missing_holdings ?? [];
  const allMissing =
    missing.length > 0 &&
    !!analytics.holdings &&
    missing.length === analytics.holdings.length;

  if (allMissing) {
    return (
      <div className="glass-card rounded-card">
        <EmptyState
          icon={SearchX}
          intent="warning"
          title="None of these schemes could be analysed"
          description="We couldn't find NAV or screener data for any of them. Adjust the holdings below and re-run."
        />
      </div>
    );
  }

  const score = scoreValue(analytics.performance_score_chart_data);
  const risk = scoreValue(analytics.risk_score_chart_data);
  const categories = (analytics.category_wise_allocations ?? []).map((c) => ({
    name: shortCategory(c.name),
    value: c.value,
  }));
  const topCat = topSlice(categories);
  const er = analytics.cost_analysis?.weighted_expense_ratio;
  const schemes = analytics.total_schemes ?? analytics.holdings?.length ?? 0;

  const badges: ScoreBadge[] = [];
  if (topCat && Math.abs(topCat.value) > 35)
    badges.push({
      tone: "warn",
      text: `Heavy in ${topCat.name} (${Math.abs(topCat.value).toFixed(1)}%)`,
    });
  if (score !== null)
    badges.push(
      score > 60
        ? { tone: "ok", text: "Performance score strong" }
        : { tone: "warn", text: "Performance below peers" },
    );
  if (typeof er === "number")
    badges.push({
      tone: er <= 1 ? "ok" : "warn",
      text: `Expense ratio ${er.toFixed(2)}%`,
    });

  const flags: Flag[] = [];
  if (topCat)
    flags.push({
      warn: Math.abs(topCat.value) > 40,
      text: `${topCat.name} is ${Math.abs(topCat.value).toFixed(1)}% of the portfolio`,
    });
  if (schemes > 0)
    flags.push({
      warn: schemes > 10,
      text:
        schemes > 10
          ? `${schemes} schemes — likely overlapping; consider consolidating`
          : `${schemes} scheme${schemes === 1 ? "" : "s"} — a manageable line-up`,
    });
  if (typeof er === "number")
    flags.push({
      warn: er > 1,
      text: `Weighted expense ratio ${er.toFixed(2)}% ${er > 1 ? "— above the 1% mark" : "— well within 1%"}`,
    });
  if (risk !== null)
    flags.push({
      warn: risk > 60,
      text: `Risk score ${Math.round(risk)} — ${riskLabel(risk).toLowerCase()} risk`,
    });
  if (missing.length > 0)
    flags.push({
      warn: true,
      text: `${missing.length} scheme${missing.length === 1 ? "" : "s"} excluded for missing data`,
    });

  // A fragment, so each card is a direct child of the modal's scroll column.
  return (
    <>
      {showMissingHoldingsWarning && missing.length > 0 && (
        <Notice tone="warning">
          {missing.length} scheme{missing.length === 1 ? "" : "s"} couldn&apos;t
          be analysed ({missing.map((m) => m.ISIN).join(", ")}) — excluded from
          these figures.
        </Notice>
      )}

      <ScoreCard
        title="FinSharpe Portfolio Score"
        scoreLabel="Performance Score"
        score={score}
        risk={risk}
        badges={badges}
        onRerun={onRerun}
        isRerunning={isRerunning}
      />

      <ReturnsCard data={analytics.returns_chart_data} />

      {categories.length > 0 && (
        <DataPanel
          title="Category Allocation"
          icon={PieChart}
        >
          <DonutBreakdown segments={categories} />
        </DataPanel>
      )}

      <FundDetailsCard holdings={analytics.holdings} />

      <CostCard cost={analytics.cost_analysis} />

      <SnapshotCard stats={analytics.stats} />

      {flags.length > 0 && (
        <DataPanel title="Risk Flags">
          <FlagList flags={flags} />
        </DataPanel>
      )}
    </>
  );
}
