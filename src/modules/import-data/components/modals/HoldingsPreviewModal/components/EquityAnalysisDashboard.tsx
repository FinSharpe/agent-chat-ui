"use client";
import { SearchX } from "lucide-react";
import type { PortfolioAnalytics } from "@/api/generated/strategy-apis/models";
import {
  DataPanel,
  EmptyState,
  FlagList,
  Notice,
  type Flag,
} from "@/modules/import-data/components/shared/ui";
import { AllocationPair } from "./analysis/AllocationPair";
import { ReturnsCard } from "./analysis/ReturnsCard";
import { ScoreCard, type ScoreBadge } from "./analysis/ScoreCard";
import { SnapshotCard } from "./analysis/SnapshotCard";
import {
  riskLabel,
  scoreValue,
  topHolding,
  topNWeight,
  topSlice,
} from "./analysis/analysis-utils";

export type DashboardProps<A> = {
  analytics: A;
  showMissingHoldingsWarning?: boolean;
  onRerun?: () => void;
  isRerunning?: boolean;
};

/**
 * Equity analysis in the reference "Equity Portfolio Analysis" layout: score
 * card, cumulative returns, sector + market-cap donuts, stats snapshot and the
 * risk & concentration list — all from the Portfolio Analytics API response.
 */
export function EquityAnalysisDashboard({
  analytics,
  showMissingHoldingsWarning = true,
  onRerun,
  isRerunning,
}: DashboardProps<PortfolioAnalytics>) {
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
          title="None of these holdings could be analysed"
          description="We couldn't find price or screener data for any of them. Adjust the holdings below and re-run."
        />
      </div>
    );
  }

  const score = scoreValue(analytics.overall_score_chart_data);
  const risk = scoreValue(analytics.risk_score_chart_data);
  const sector = topSlice(analytics.industry_distribution);
  const top5 = topNWeight(analytics.holdings, 5);
  const top1 = topHolding(analytics.holdings, ["Ticker", "Company_Name"]);
  const small = analytics.size_distribution?.find((s) => /small/i.test(s.name));
  const sectorCount = analytics.industry_distribution?.length ?? 0;

  const badges: ScoreBadge[] = [];
  if (sector && Math.abs(sector.value) > 25)
    badges.push({
      tone: "warn",
      text: `Overweight ${sector.name} (${Math.abs(sector.value).toFixed(1)}%)`,
    });
  if (score !== null)
    badges.push(
      score > 60
        ? { tone: "ok", text: "FinSharpe score strong" }
        : { tone: "warn", text: "FinSharpe score below par" },
    );
  if (top5 !== null)
    badges.push({ text: `${top5.toFixed(0)}% in top 5 stocks` });

  const flags: Flag[] = [];
  if (top5 !== null)
    flags.push({
      warn: top5 > 60,
      text: `Top 5 stocks = ${top5.toFixed(1)}% of portfolio`,
    });
  if (top1)
    flags.push({
      warn: top1.weight > 20,
      text: `Largest position: ${top1.name} at ${top1.weight.toFixed(1)}%`,
    });
  if (sector)
    flags.push({
      warn: Math.abs(sector.value) > 30,
      text: `${sector.name} sector concentration: ${Math.abs(sector.value).toFixed(1)}%`,
    });
  if (sectorCount > 0)
    flags.push({
      warn: sectorCount < 5,
      text: `Spread across ${sectorCount} sector${sectorCount === 1 ? "" : "s"}`,
    });
  if (small && small.value > 25)
    flags.push({
      warn: true,
      text: `Small caps = ${small.value.toFixed(1)}% — elevated volatility exposure`,
    });
  if (risk !== null)
    flags.push({
      warn: risk > 60,
      text: `Risk score ${Math.round(risk)} — ${riskLabel(risk).toLowerCase()} risk`,
    });
  if (missing.length > 0)
    flags.push({
      warn: true,
      text: `${missing.length} holding${missing.length === 1 ? "" : "s"} excluded for missing data`,
    });

  // A fragment, so each card is a direct child of the modal's scroll column
  // and takes its spacing (the popup widens it on desktop).
  return (
    <>
      {showMissingHoldingsWarning && missing.length > 0 && (
        <Notice tone="warning">
          {missing.length} holding{missing.length === 1 ? "" : "s"}{" "}
          couldn&apos;t be analysed ({missing.map((m) => m.Ticker).join(", ")})
          — excluded from these figures.
        </Notice>
      )}

      <ScoreCard
        title="FinSharpe Portfolio Score"
        scoreLabel="FinSharpe Score"
        score={score}
        risk={risk}
        badges={badges}
        onRerun={onRerun}
        isRerunning={isRerunning}
      />

      <ReturnsCard data={analytics.returns_chart_data} />

      <AllocationPair
        left={{
          label: "Sectors",
          segments: analytics.industry_distribution ?? [],
        }}
        right={{
          label: "Market Cap",
          segments: analytics.size_distribution ?? [],
        }}
      />

      <SnapshotCard stats={analytics.stats} />

      {flags.length > 0 && (
        <DataPanel title="Risk & Concentration">
          <FlagList flags={flags} />
        </DataPanel>
      )}
    </>
  );
}
