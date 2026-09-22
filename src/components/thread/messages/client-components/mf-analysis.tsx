"use client";

import type {
  MFAnalysis,
  PeerChartData,
  ScoreSection,
} from "@/api/generated/report-apis/models";
import FinSharpeScoresRadarChart from "@/components/pdfs_templates/pf-report/FinSharpeScoresRadarChart";
import { MonthlyReturnsHeatmapTables } from "@/components/pdfs_templates/pf-report/MonthlyReturnsHeatmap";
import { SectionFormatter } from "@/lib/section-formatter";
import type { MonthlyReturnsHeatmapData } from "@/types/pf-analysis";
import type { Section } from "@/types/mf-analysis";
import OverallScorePie from "@/modules/core/portfolio/charts/OverallScorePie";
import RiskScorePie from "@/modules/core/portfolio/charts/RiskScorePie";
import { useQueryState } from "nuqs";
import { useRef } from "react";
import { MarkdownText } from "../../markdown-text";
import { ANALYSIS_PROSE } from "./analysis-prose";
import {
  AnalysisCard,
  AnalysisPanel,
  BackToTopButton,
} from "./analysis-chrome";
import DistributionPieChart from "./DistributionPieChart";
import DrawdownChart from "./DrawdownChart";
import LineChart from "./LineChart";
import { MfAnalysisDownloadDialog } from "./mf-analysis-download-dialog";
import PeerComparisonChart from "./PeerComparisonChart";

export default function MfAnalysisComponent(analysis: MFAnalysis) {
  console.log("Rendering MfAnalysisComponent with data:", analysis);
  const [threadId] = useQueryState("threadId");
  const { data } = analysis;
  const topRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={topRef}
      className="space-y-3"
    >
      {/* 1. Fund Overview */}
      <AnalysisCard>
        <FormatSection
          section={data.fund_overview.scheme_overview}
          seqNumber={1}
        />
        {data.fund_overview.fund_manager && (
          <FormatSection section={data.fund_overview.fund_manager as Section} />
        )}
      </AnalysisCard>

      {/* 2. Performance */}
      <AnalysisCard>
        <FormatSection
          section={data.performance.analysis}
          seqNumber={2}
        />
        {data.performance.returns_chart && (
          <LineChart
            {...(data.performance.returns_chart as Record<string, any>)}
            className="!min-w-0"
          />
        )}
        {data.performance.trailing_returns_chart && (
          <PeerComparisonChart
            data={data.performance.trailing_returns_chart as PeerChartData}
            labelKey="period"
          />
        )}
        {data.performance.drawdown_chart && (
          <DrawdownChart
            data={data.performance.drawdown_chart as any}
            returnsData={(data.performance.returns_chart as any)?.data}
          />
        )}
        {data.performance.monthly_returns && (
          <div className="space-y-2">
            {(data.performance.monthly_returns as any)?.heatmap && (
              <div className="overflow-x-auto">
                <MonthlyReturnsHeatmapTables
                  heatmap={
                    (data.performance.monthly_returns as any)
                      .heatmap as MonthlyReturnsHeatmapData
                  }
                />
              </div>
            )}
            {(data.performance.monthly_returns as any)?.summary && (
              <div className={ANALYSIS_PROSE}>
                <MarkdownText>
                  {(data.performance.monthly_returns as any).summary}
                </MarkdownText>
              </div>
            )}
          </div>
        )}
        {/* {data.performance.rolling_sortino_chart && (
          <LineChart
            {...(data.performance.rolling_sortino_chart as Record<string, any>)}
            className="!min-w-0"
          />
        )} */}
      </AnalysisCard>

      {/* 3. Ratios */}
      <AnalysisCard>
        <FormatSection
          section={data.ratios.risk_metrics}
          seqNumber={3}
        />
        <FormatSection section={data.ratios.cost_analysis} />
        {data.ratios.valuation_metrics && (
          <FormatSection section={data.ratios.valuation_metrics as Section} />
        )}
      </AnalysisCard>

      {/* 4. Portfolio */}
      <AnalysisCard>
        <FormatSection
          section={data.portfolio.asset_allocation}
          seqNumber={4}
        />
        <FormatSection section={data.portfolio.top_holdings} />
        {data.portfolio.top_holdings_chart && (
          <PeerComparisonChart
            data={data.portfolio.top_holdings_chart as PeerChartData}
            hideLegend
          />
        )}
        {/* <FormatSection section={data.portfolio.sector_distribution} /> */}
        {data.portfolio.sector_chart && (
          <DistributionPieChart
            title="Sector Distribution"
            data={
              data.portfolio.sector_chart as { name: string; value: number }[]
            }
            useGrouping
          />
        )}
        {data.portfolio.mcap_chart && (
          <DistributionPieChart
            title="Market Cap Distribution"
            data={
              data.portfolio.mcap_chart as { name: string; value: number }[]
            }
            useSizeColors
          />
        )}
      </AnalysisCard>

      {/* 5. Peer Comparison */}
      <AnalysisCard>
        <FormatSection
          section={data.peer_comparison.analysis}
          seqNumber={5}
        />
        {data.peer_comparison.returns_chart && (
          <PeerComparisonChart
            data={data.peer_comparison.returns_chart as PeerChartData}
            labelKey="fund"
          />
        )}
        {data.peer_comparison.risk_adjusted_chart && (
          <PeerComparisonChart
            data={data.peer_comparison.risk_adjusted_chart as PeerChartData}
            labelKey="fund"
          />
        )}
      </AnalysisCard>

      {/* 6. FinSharpe Analysis */}
      {data.finsharpe_analysis && (
        <AnalysisCard>
          <FormatSection
            section={(data.finsharpe_analysis as any).analysis}
            seqNumber={6}
          />
          {(() => {
            const sections = (data.finsharpe_analysis as any).sections || [];
            const radarSections = sections.filter(
              (s: ScoreSection) => s.chart_type === "radar",
            );
            const gaugeSections = sections.filter(
              (s: ScoreSection) =>
                s.chart_type === "gauge" && s.chart_data?.length,
            );
            return (
              <>
                {radarSections.map((s: ScoreSection, idx: number) => (
                  <FinSharpeScoresRadarChart
                    key={`radar-${idx}`}
                    data={s.scores_comparison}
                    className="mx-auto h-80 max-w-lg"
                  />
                ))}
                {gaugeSections.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {gaugeSections.map((s: ScoreSection, idx: number) => {
                      const isRisk = s.title?.toLowerCase().includes("risk");
                      const PieComponent = isRisk
                        ? RiskScorePie
                        : OverallScorePie;
                      return (
                        <AnalysisPanel
                          key={`gauge-${idx}`}
                          title={s.title}
                        >
                          <div className="p-4 pt-2">
                            <div className="relative h-[28vh] w-full sm:h-[50vh] sm:max-h-[350px]">
                              <PieComponent
                                data={s.chart_data}
                                shouldRenderActiveShapeLabel={true}
                              />
                            </div>
                            {s.summary && (
                              <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                                {s.summary}
                              </p>
                            )}
                          </div>
                        </AnalysisPanel>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </AnalysisCard>
      )}

      {/* 7. Outlook */}
      <AnalysisCard>
        <FormatSection
          section={data.outlook.summary}
          seqNumber={7}
        />
        <FormatSection section={data.outlook.conclusion} />
      </AnalysisCard>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <BackToTopButton
          onClick={() =>
            topRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
        />
        <MfAnalysisDownloadDialog
          threadId={threadId}
          analysisId={analysis.id}
          schemeName={analysis.scheme_name}
        />
      </div>
    </div>
  );
}

/* ─── Helper components ──────────────────────────────────────────── */

function FormatSection({
  section,
  seqNumber,
}: {
  section: Section;
  seqNumber?: number;
}) {
  if (!section) return null;

  const formatter = new SectionFormatter(section, seqNumber);
  return (
    <div className={ANALYSIS_PROSE}>
      <MarkdownText>{formatter.getMarkdown()}</MarkdownText>
    </div>
  );
}

