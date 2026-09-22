"use client";

import type {
  FundamentalChartData,
  PeerChartData,
  ScoreSection,
  StockAnalysis,
} from "@/api/generated/report-apis/models";
import FinSharpeScoresRadarChart from "@/components/pdfs_templates/pf-report/FinSharpeScoresRadarChart";
import { MonthlyReturnsHeatmapTables } from "@/components/pdfs_templates/pf-report/MonthlyReturnsHeatmap";
import { SectionFormatter } from "@/lib/section-formatter";
import type { MonthlyReturnsHeatmapData } from "@/types/pf-analysis";
import type { Section } from "@/types/stock-analysis";
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
import DrawdownChart from "./DrawdownChart";
import FundamentalChart from "./FundamentalChart";
import { FormatNewsSentiment } from "./format-news-sentiment";
import LineChart from "./LineChart";
import PeerComparisonChart from "./PeerComparisonChart";
import RiskMetricsTable from "./RiskMetricsTable";
import SimulationChart from "./SimulationChart";
import { StockAnalysisDownloadDialog } from "./stock-analysis-download-dialog";

export default function StockAnalysisComponent(analysis: StockAnalysis) {
  const [threadId] = useQueryState("threadId");
  const { data } = analysis;
  const topRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={topRef} className="space-y-3">
      {/* 1. Company Overview */}
      <AnalysisCard>
        <FormatSection
          section={data.company_overview.business_overview}
          seqNumber={1}
        />
        {data.company_overview.management_strategy && (
          <FormatSection
            section={data.company_overview.management_strategy as Section}
          />
        )}
        <FormatSection section={data.company_overview.sector_outlook} />
      </AnalysisCard>

      {/* 2. Technical Analysis */}
      <AnalysisCard>
        <FormatSection
          section={data.technical_analysis.analysis}
          seqNumber={2}
        />
        {data.technical_analysis.returns_chart && (
          <LineChart
            {...(data.technical_analysis.returns_chart as Record<string, any>)}
            className="!min-w-0"
          />
        )}
        {data.technical_analysis.drawdown_chart && (
          <DrawdownChart
            data={data.technical_analysis.drawdown_chart as any}
            returnsData={
              (data.technical_analysis.returns_chart as any)?.data
            }
          />
        )}
        {data.technical_analysis.monthly_returns && (
          <div className="space-y-2">
            {(data.technical_analysis.monthly_returns as any)?.heatmap && (
              <div className="overflow-x-auto">
                <MonthlyReturnsHeatmapTables
                  heatmap={
                    (data.technical_analysis.monthly_returns as any)
                      .heatmap as MonthlyReturnsHeatmapData
                  }
                />
              </div>
            )}
            {(data.technical_analysis.monthly_returns as any)?.summary && (
              <div className={ANALYSIS_PROSE}>
                <MarkdownText>
                  {(data.technical_analysis.monthly_returns as any).summary}
                </MarkdownText>
              </div>
            )}
          </div>
        )}
        {data.technical_analysis.rolling_sortino_chart && (
          <LineChart
            {...(data.technical_analysis.rolling_sortino_chart as Record<string, any>)}
            className="!min-w-0"
          />
        )}
        {data.technical_analysis.risk_metrics && (
          <RiskMetricsTable
            data={
              data.technical_analysis.risk_metrics as Record<string, unknown>[]
            }
          />
        )}
      </AnalysisCard>

      {/* 3. Fundamental Analysis */}
      <AnalysisCard>
        <FormatSection
          section={data.fundamental_analysis.analysis}
          seqNumber={3}
        />
        {data.fundamental_analysis.revenue_profit_chart && (
          <FundamentalChart
            data={
              data.fundamental_analysis
                .revenue_profit_chart as FundamentalChartData
            }
          />
        )}
        {data.fundamental_analysis.margin_chart && (
          <FundamentalChart
            data={
              data.fundamental_analysis.margin_chart as FundamentalChartData
            }
          />
        )}
      </AnalysisCard>

      {/* 4. Peer Comparison */}
      <AnalysisCard>
        <FormatSection
          section={data.peer_comparison.analysis}
          seqNumber={4}
        />
        {data.peer_comparison.valuation_chart && (
          <PeerComparisonChart
            data={data.peer_comparison.valuation_chart as PeerChartData}
          />
        )}
        {data.peer_comparison.profitability_chart && (
          <PeerComparisonChart
            data={data.peer_comparison.profitability_chart as PeerChartData}
          />
        )}
      </AnalysisCard>

      {/* 5. Market Sentiment */}
      <AnalysisCard>
        <div className={ANALYSIS_PROSE}>
          <FormatNewsSentiment
            section={data.market_sentiment.news_sentiment}
            seqNumber={5}
          />
        </div>
        {data.market_sentiment.conference_call && (
          <FormatSection
            section={data.market_sentiment.conference_call as Section}
          />
        )}
        {data.market_sentiment.corporate_actions && (
          <FormatSection
            section={data.market_sentiment.corporate_actions as Section}
          />
        )}
        <FormatSection section={data.market_sentiment.shareholding_pattern} />
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
                      const isRisk = s.title
                        ?.toLowerCase()
                        .includes("risk");
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
        <FormatSection section={data.outlook.summary} seqNumber={7} />
        <FormatSection section={data.outlook.red_flags} />
        {data.outlook.simulation_chart && (
          <SimulationChart {...(data.outlook.simulation_chart as any)} />
        )}
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
        <StockAnalysisDownloadDialog
          threadId={threadId}
          analysisId={analysis.id}
          companyName={analysis.company_name}
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
