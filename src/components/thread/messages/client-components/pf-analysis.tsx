"use client";

import type { ScreenerCoverage } from "@/api/generated/report-apis/models";
import ScreenerCoverageBadge from "@/components/pdfs_templates/pf-report/ScreenerCoverageBadge";
import { convertToMarkdownTable } from "@/lib/convertToMarkdownTable";
import { formatKey, getPortfolioDisplayTable } from "@/lib/format-utils";
import groupSmallFragments from "@/lib/groupSmallFragments";
import OverallScorePie from "@/modules/core/portfolio/charts/OverallScorePie";
import RiskScorePie from "@/modules/core/portfolio/charts/RiskScorePie";
import type {
  ChartData,
  CorrelationHeatmapRow,
  DrawdownChartData,
  MonthlyReturnsHeatmapData,
  PfAnalysis,
  PFFinSharpeAnalysisData,
  Section,
} from "@/types/pf-analysis";
import { useQueryState } from "nuqs";
import { useRef } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { MarkdownText } from "../../markdown-text";
import { ANALYSIS_PROSE } from "./analysis-prose";
import {
  AnalysisCard,
  AnalysisCardTitle,
  AnalysisPanel,
  BackToTopButton,
} from "./analysis-chrome";
import CorrelationHeatmap from "@/components/pdfs_templates/pf-report/CorrelationHeatmap";
import FinSharpeScoresRadarChart from "@/components/pdfs_templates/pf-report/FinSharpeScoresRadarChart";
import { MonthlyReturnsHeatmapTables } from "@/components/pdfs_templates/pf-report/MonthlyReturnsHeatmap";
import DrawdownChart from "./DrawdownChart";
import LineChart from "./LineChart";
import { PfAnalysisDownloadDialog } from "./pf-analysis-download-dialog";

import { PIE_COLORS, SIZE_COLORS } from "@/configs/chart-colors";

export default function PfAnalysisComponent(analysis: PfAnalysis) {
  const [threadId] = useQueryState("threadId");
  const { data } = analysis;
  const returnsChart = data.returns_chart as ChartData | null | undefined;

  const drawdownSection = data.drawdown as
    | { analysis?: Section; chart?: DrawdownChartData | null }
    | undefined;
  const drawdownChart = drawdownSection?.chart ?? null;

  const correlationSection = data.correlation as
    | { analysis?: Section; heatmap?: CorrelationHeatmapRow[] | null }
    | undefined;

  const monthlyReturnsSection = data.monthly_returns as
    | { heatmap?: MonthlyReturnsHeatmapData; summary?: string }
    | undefined;

  const topRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: "overview", label: "Overview", show: !!data.portfolio_overview },
    {
      id: "performance",
      label: "Performance",
      show: !!data.performance_analysis,
    },
    { id: "risk", label: "Risk", show: !!data.risk_assessment },
    {
      id: "risk-adj",
      label: "Risk-Adjusted",
      show: !!data.risk_adjusted_returns,
    },
    { id: "drawdown", label: "Drawdown", show: !!drawdownSection?.analysis },
    {
      id: "correlation",
      label: "Correlation",
      show: !!correlationSection?.analysis,
    },
    {
      id: "monthly",
      label: "Monthly",
      show: !!(
        monthlyReturnsSection?.summary || monthlyReturnsSection?.heatmap
      ),
    },
    { id: "finsharpe", label: "FinSharpe", show: !!data.finsharpe_analysis },
    {
      id: "allocation",
      label: "Allocation",
      show: !!(
        data.sector_allocation?.items?.length ||
        data.market_cap_allocation?.items?.length
      ),
    },
    { id: "summary", label: "Summary", show: !!data.summary },
    {
      id: "recommendation",
      label: "Recommendation",
      show: !!data.recommendation,
    },
  ].filter((n) => n.show);

  return (
    <div
      ref={topRef}
      className="space-y-3"
    >
      {/* Header — the reference's analysis-card head: name, meta line, type pill. */}
      <AnalysisCard className="space-y-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h3 className="font-geist truncate text-base leading-tight font-medium text-[#0A1F4D]">
              {analysis.portfolio_name}
            </h3>
            <p className="text-[10px] text-slate-400 tabular-nums">
              {analysis.holdings_count} holdings
              {analysis.date && <> · {analysis.date}</>}
            </p>
            <span className="inline-block rounded-full bg-[#063BAA]/8 px-2 py-0.5 text-[9px] font-medium tracking-wider text-[#063BAA] uppercase">
              {analysis.portfolio_type === "mutual_fund"
                ? "Mutual Fund"
                : "Stock"}{" "}
              portfolio
            </span>
          </div>
          <PfAnalysisDownloadDialog
            threadId={threadId}
            analysisId={analysis.id}
            portfolioName={analysis.portfolio_name}
          />
        </div>
      </AnalysisCard>

      {/* Navigation */}
      <nav className="scrollbar-none overflow-x-auto">
        <div className="flex gap-2 pb-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                document
                  .getElementById(`pf-${item.id}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="shrink-0 rounded-full bg-[#063BAA]/6 px-3.5 py-2 text-[11px] font-medium text-slate-500 transition-colors hover:text-[#063BAA] active:scale-[0.97]"
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* 1. Portfolio Overview */}
      <div id="pf-overview">
        <PortfolioOverviewSection
          section={data.portfolio_overview}
          portfolio={analysis.portfolio}
          portfolioType={analysis.portfolio_type}
        />
      </div>

      {/* 2. Performance Analysis + Returns Chart */}
      <div id="pf-performance">
        <SectionCard section={data.performance_analysis} />
        {returnsChart && (
          <div className="mt-3 overflow-hidden">
            <LineChart
              data={returnsChart.data}
              colors={returnsChart.colors}
              title={returnsChart.title}
              description={returnsChart.description}
              className="!min-w-0"
            />
          </div>
        )}
      </div>

      {/* 3. Risk Assessment */}
      <div id="pf-risk">
        <SectionCard section={data.risk_assessment} />
      </div>

      {/* 4. Risk-Adjusted Returns */}
      <div id="pf-risk-adj">
        <SectionCard section={data.risk_adjusted_returns} />
      </div>

      {/* 5. Drawdown Analysis + Chart */}
      {drawdownSection?.analysis && (
        <div id="pf-drawdown">
          <SectionCard section={drawdownSection.analysis} />
          {drawdownChart && (
            <div className="mt-3">
              <AnalysisCard className="space-y-2 overflow-hidden p-0 pt-5">
                <div className="px-5">
                  <AnalysisCardTitle>{drawdownChart.title}</AnalysisCardTitle>
                </div>
                <DrawdownChart
                  data={drawdownChart}
                  returnsData={returnsChart?.data}
                />
              </AnalysisCard>
            </div>
          )}
        </div>
      )}

      {/* 6. Correlation Analysis */}
      {correlationSection?.analysis && (
        <div id="pf-correlation">
          <AnalysisCard className="space-y-0 overflow-hidden p-0">
            {/* Heading */}
            <div className="px-5 pt-5 pb-2">
              <AnalysisCardTitle>
                {correlationSection.analysis.title}
              </AnalysisCardTitle>
            </div>

            {/* Chart */}
            {correlationSection.heatmap &&
              correlationSection.heatmap.length > 0 && (
                <div className="chat-container overflow-x-auto p-2">
                  <div className="max-w-[calc(100dvw-4rem)] md:max-w-3xl">
                    <CorrelationHeatmap
                      className="p-0"
                      data={correlationSection.heatmap}
                    />
                  </div>
                </div>
              )}

            {/* Content / Summary */}
            <div className={cn("p-5", ANALYSIS_PROSE)}>
              <MarkdownText>{correlationSection.analysis.content}</MarkdownText>

              {/* In-depth Analysis */}
              {correlationSection.analysis.in_depth_analysis && (
                <div className="mt-3">
                  <MarkdownText>
                    {`<details><summary>In-depth Analysis</summary>\n\n${correlationSection.analysis.in_depth_analysis}\n</details>`}
                  </MarkdownText>
                </div>
              )}

              {/* Sources */}
              {correlationSection.analysis.sources && (
                <div className="mt-3">
                  {typeof correlationSection.analysis.sources === "object" &&
                  !Array.isArray(correlationSection.analysis.sources) ? (
                    <JsonSourcesDisplay
                      sources={correlationSection.analysis.sources}
                    />
                  ) : (
                    <MarkdownText>
                      {formatSources(correlationSection.analysis.sources)}
                    </MarkdownText>
                  )}
                </div>
              )}
            </div>
          </AnalysisCard>
        </div>
      )}

      {/* 7. Monthly Returns */}
      {(monthlyReturnsSection?.summary || monthlyReturnsSection?.heatmap) && (
        <div id="pf-monthly">
          <AnalysisCard>
            <AnalysisCardTitle>Monthly Returns</AnalysisCardTitle>
            <div>
              {monthlyReturnsSection.summary && (
                <p className="mb-4 text-[11px] leading-relaxed text-slate-500">
                  {monthlyReturnsSection.summary}
                </p>
              )}
              {monthlyReturnsSection.heatmap ? (
                <div className="chat-container overflow-x-auto">
                  <MonthlyReturnsHeatmapTables
                    heatmap={monthlyReturnsSection.heatmap}
                    className="min-w-[640px] space-y-8"
                  />
                </div>
              ) : null}
            </div>
          </AnalysisCard>
        </div>
      )}

      {/* 8. FinSharpe Analysis (stock portfolios) */}
      {data.finsharpe_analysis && (
        <div id="pf-finsharpe">
          <FinSharpeAnalysisSection
            data={data.finsharpe_analysis}
            screenerCoverage={data.finsharpe_analysis.screener_coverage}
          />
        </div>
      )}

      {/* 9. Allocation Charts */}
      <div id="pf-allocation">
        <DistributionChartsSection
          sectorDistribution={data.sector_allocation?.items}
          marketCapDistribution={data.market_cap_allocation?.items}
          sectorAllocationSummary={data.sector_allocation?.summary}
          marketCapAllocationSummary={data.market_cap_allocation?.summary}
        />
      </div>

      {/* 10. Summary */}
      <div id="pf-summary">
        <SectionCard section={data.summary} />
      </div>

      {/* 11. Recommendation */}
      <div id="pf-recommendation">
        <SectionCard section={data.recommendation} />
      </div>

      {/* Footer */}
      <div className="flex justify-end pt-1">
        <BackToTopButton
          label="Top"
          onClick={() =>
            topRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
        />
      </div>
    </div>
  );
}

/* ─── Reusable layout components ─────────────────────────────────── */

/* ─── Section components ─────────────────────────────────────────── */

function PortfolioOverviewSection({
  section,
  portfolio,
  portfolioType,
}: {
  section: Section;
  portfolio?: Record<string, any>[];
  portfolioType?: string;
}) {
  if (!section) return null;

  const portfolioTable = getPortfolioDisplayTable(portfolio, portfolioType);

  const content = `${section.content}\n\n${portfolioTable ? `\n${portfolioTable}\n` : ""}`;

  const _section: Section = {
    title: section.title,
    content: content,
    sources: convertToMarkdownTable(portfolio || []),
  };

  return (
    <SectionCard section={_section} />
  );
}

function SectionCard({ section }: { section: Section }) {
  if (!section) return null;

  const title = `## ${section.title}\n`;
  const content = `${section.content}\n`;
  const inDepth = section.in_depth_analysis
    ? `<details><summary>In-depth Analysis</summary>\n\n${section.in_depth_analysis}\n</details>\n`
    : "";
  const sources = formatSources(section.sources);
  const markdown = `${title}${content}${inDepth}${sources}`;

  return (
    <AnalysisCard>
      <div className={ANALYSIS_PROSE}>
        <MarkdownText>{markdown}</MarkdownText>
      </div>
      {section.sources &&
        typeof section.sources === "object" &&
        !Array.isArray(section.sources) && (
          <JsonSourcesDisplay sources={section.sources} />
        )}
    </AnalysisCard>
  );
}

function FinSharpeAnalysisSection({
  data,
  screenerCoverage,
}: {
  data: PFFinSharpeAnalysisData;
  screenerCoverage?: ScreenerCoverage | null;
}) {
  if (!data) return null;

  const analysis = data.analysis;
  const gaugeSections = (data.sections || []).filter(
    (s) => s.chart_type === "gauge" && s.chart_data?.length,
  );
  const radarSections = (data.sections || []).filter(
    (s) => s.chart_type === "radar" && s.scores_comparison?.length,
  );

  return (
    <div className="space-y-3">
      <AnalysisCard className="space-y-0 overflow-hidden p-0">
        {/* Heading */}
        {analysis && (
          <div className="px-5 pt-5 pb-1">
            <AnalysisCardTitle>{analysis.title}</AnalysisCardTitle>
          </div>
        )}

        {/* Charts — Gauge scores */}
        {gaugeSections.length > 0 && (
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            {gaugeSections.map((section) => {
              const isRisk = section.title.toLowerCase().includes("risk");
              return (
                <AnalysisPanel
                  key={section.title}
                  title={section.title}
                >
                  <div className="p-4 pt-2">
                    <div className="relative h-[28vh] w-full sm:h-[50vh] sm:max-h-[350px]">
                      {isRisk ? (
                        <RiskScorePie
                          data={section.chart_data as any}
                          shouldRenderActiveShapeLabel={true}
                        />
                      ) : (
                        <OverallScorePie
                          data={section.chart_data as any}
                          shouldRenderActiveShapeLabel={true}
                        />
                      )}
                    </div>
                    {section.summary && (
                      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                        {section.summary}
                      </p>
                    )}
                  </div>
                </AnalysisPanel>
              );
            })}
          </div>
        )}

        {/* Charts — Radar */}
        {radarSections.map((section) => (
          <div
            key={section.title}
            className="p-4"
          >
            <h5 className="mb-2 text-[9px] font-medium tracking-wider text-slate-400 uppercase">
              {section.title}
            </h5>
            <FinSharpeScoresRadarChart
              data={section.scores_comparison}
              className="h-64 w-full sm:h-96"
            />
            {section.summary && (
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                {section.summary}
              </p>
            )}
          </div>
        ))}

        {/* Content / Summary */}
        {analysis && (
          <div className={cn("p-5", ANALYSIS_PROSE)}>
            <MarkdownText>{analysis.content}</MarkdownText>

            {analysis.in_depth_analysis && (
              <div className="mt-3">
                <MarkdownText>
                  {`<details><summary>In-depth Analysis</summary>\n\n${analysis.in_depth_analysis}\n</details>`}
                </MarkdownText>
              </div>
            )}

            {/* Sources */}
            {analysis.sources && (
              <div className="mt-3">
                {typeof analysis.sources === "object" &&
                !Array.isArray(analysis.sources) ? (
                  <JsonSourcesDisplay sources={analysis.sources} />
                ) : (
                  <MarkdownText>
                    {formatSources(analysis.sources)}
                  </MarkdownText>
                )}
              </div>
            )}
          </div>
        )}

        <ScreenerCoverageBadge
          coverage={screenerCoverage}
          showMissing={true}
          className="px-5 pb-4"
        />
      </AnalysisCard>
    </div>
  );
}

function DistributionChartsSection({
  sectorDistribution,
  marketCapDistribution,
  sectorAllocationSummary,
  marketCapAllocationSummary,
}: {
  sectorDistribution?: { name: string; value: number }[];
  marketCapDistribution?: { name: string; value: number }[];
  sectorAllocationSummary?: string;
  marketCapAllocationSummary?: string;
}) {
  const industryWithColors = groupSmallFragments(sectorDistribution || [], {
    id: "name",
    value: "value",
    maxFragments: 15,
  }).map((item, index) => ({
    name: item.name,
    value: item.value,
    color: PIE_COLORS[index % PIE_COLORS.length],
  }));

  const sizeWithColors = (marketCapDistribution || []).map((item) => ({
    name: item.name,
    value: item.value,
    color: SIZE_COLORS[item.name] || PIE_COLORS[0],
  }));

  if (industryWithColors.length === 0 && sizeWithColors.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3">
      {/* Sector Distribution */}
      {industryWithColors.length > 0 && (
        <AnalysisCard>
          <AnalysisCardTitle>Sector Allocation</AnalysisCardTitle>
          <div>
            {sectorAllocationSummary && (
              <p className="mb-4 text-[11px] leading-relaxed text-slate-500">
                {sectorAllocationSummary}
              </p>
            )}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="h-48 shrink-0 md:w-48">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={industryWithColors}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {industryWithColors.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `${Number(value).toFixed(2)}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid flex-1 grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {industryWithColors.map((industry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 py-0.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: industry.color }}
                      />
                      <span className="truncate text-[11px] text-slate-500">
                        {industry.name}
                      </span>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-[#0A1F4D] tabular-nums">
                      {Number(industry.value).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnalysisCard>
      )}

      {/* Market Cap Distribution */}
      {sizeWithColors.length > 0 && (
        <AnalysisCard>
          <AnalysisCardTitle>Market Cap Allocation</AnalysisCardTitle>
          <div>
            {marketCapAllocationSummary && (
              <p className="mb-4 text-[11px] leading-relaxed text-slate-500">
                {marketCapAllocationSummary}
              </p>
            )}
            <div className="space-y-3">
              {sizeWithColors.map((size, index) => (
                <div key={index}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[#0A1F4D]">
                      {size.name}
                    </span>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {Number(size.value).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${size.value}%`,
                        backgroundColor: size.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnalysisCard>
      )}
    </div>
  );
}

/* ─── Source formatting helpers ───────────────────────────────────── */

function formatSources(
  sources: string | string[] | Record<string, any> | null | undefined,
): string {
  if (!sources) return "";

  if (typeof sources === "string") {
    return `<details><summary>Sources</summary>\n\n${sources}\n</details>\n`;
  }

  if (Array.isArray(sources)) {
    const domainPattern = /https?:\/\/(?:www\.)?([^/]+)/;
    const sourcesMarkdown = sources
      .map((source) => {
        const match = source.match(domainPattern);
        const domain = match ? match[1] : source;
        return `[${domain}](${source}) ,`;
      })
      .join("\n");

    if (sources.length > 0) {
      return `<details><summary>Sources</summary>\n\n${sourcesMarkdown}\n</details>\n`;
    }
  }

  return "";
}

function JsonSourcesDisplay({ sources }: { sources: Record<string, any> }) {
  return (
    <details className="rounded-nested mt-4 border border-slate-100 bg-slate-50 p-4">
      <summary className="cursor-pointer text-[11px] font-medium text-[#0A1F4D]">
        Sources (Data)
      </summary>
      <div className="mt-4 space-y-4">
        {Object.entries(sources).map(([key, value]) => (
          <div
            key={key}
            className="space-y-2"
          >
            <span className="text-[9px] font-medium tracking-wider text-slate-400 uppercase">
              {formatKey(key)}
            </span>
            <JsonDataDisplay data={value} />
          </div>
        ))}
      </div>
    </details>
  );
}

function JsonDataDisplay({ data }: { data: any }) {
  if (data === null || data === undefined) {
    return <span className="text-[10px] text-slate-400">N/A</span>;
  }

  if (typeof data !== "object") {
    return <span className="text-[11px] text-[#0A1F4D]">{String(data)}</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-[10px] text-slate-400">Empty</span>;
    }
    return (
      <ul className="list-inside list-disc space-y-1 text-[11px] marker:text-[#063BAA]">
        {data.map((item, idx) => (
          <li
            key={idx}
            className="text-[#0A1F4D]"
          >
            <JsonDataDisplay data={item} />
          </li>
        ))}
      </ul>
    );
  }

  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <span className="text-[10px] text-slate-400">Empty object</span>;
  }

  return (
    <div className="rounded-nested overflow-x-auto border border-slate-100 bg-white">
      <table className="min-w-full text-[11px]">
        <tbody className="divide-y divide-slate-50">
          {entries.map(([key, value]) => (
            <tr
              key={key}
              className="hover-tint"
            >
              <td className="px-4 py-2 text-[10px] whitespace-nowrap text-slate-400">
                {formatKey(key)}
              </td>
              <td className="px-4 py-2 text-[11px] font-medium text-[#0A1F4D] tabular-nums">
                {typeof value === "object" ? (
                  <JsonDataDisplay data={value} />
                ) : (
                  String(value)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
