# Stock Report Schema Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate stock analysis frontend from flat schema to grouped schema with new chart components.

**Architecture:** Replace hardcoded types with generated API types, restructure 4 consumer files to navigate grouped paths, create 3 new chart components (FundamentalChart, PeerComparisonChart, RiskMetricsTable), adopt card-based section layout matching the portfolio report pattern.

**Tech Stack:** Next.js 15, React 19, TypeScript, Recharts, Tailwind CSS, generated types from `@/api/generated/report-apis/models`

---

## Key References

- **Design doc:** `docs/plans/2026-03-07-stock-report-schema-migration-design.md`
- **Migration guide:** `docs/reference/STOCK_REPORT_SCHEMA_MIGRATION.md`
- **Sample data:** `props.json` (root) - ICICIBANK example with full new schema
- **PF report card pattern:** `src/components/thread/messages/client-components/pf-analysis.tsx:34-43` (ACCENT_BORDER map) and `:383-396` (SectionCard component)
- **Generated types:** `src/api/generated/report-apis/models/index.ts`
- **Existing reusable components:**
  - `src/components/thread/messages/client-components/LineChart.tsx` (default export, props: `data, colors, title, description, analysis, className, disableAnimation`)
  - `src/components/thread/messages/client-components/DrawdownChart.tsx` (default export, props: `data: DrawdownChartData, returnsData, className, disableAnimation`)
  - `src/components/pdfs_templates/pf-report/MonthlyReturnsHeatmap.tsx` (named export `MonthlyReturnsHeatmapTables`, props: `heatmap: MonthlyReturnsHeatmapData, className`)
  - `src/components/pdfs_templates/pf-report/FinSharpeScoresRadarChart.tsx` (default export, props: `data: FinSharpeScoreItem[], className`)
  - `src/modules/core/portfolio/charts/OverallScorePie.tsx` (default export, props: `data: {value,label}[]`)
  - `src/modules/core/portfolio/charts/RiskScorePie.tsx` (default export, props: `data: {value,label}[]`)
  - `src/components/thread/messages/client-components/SimulationChart.tsx` (default export)
- **Section formatter:** `src/lib/section-formatter.ts` (class `SectionFormatter(section, seqNumber?)`)
- **FormatNewsSentiment:** `src/components/thread/messages/client-components/format-news-sentiment.tsx` (imports `Section, NewsSource, NewsSourcesContent` from `@/types/stock-analysis`)

---

### Task 1: Update Types File

**Files:**
- Modify: `src/types/stock-analysis.ts`

**Step 1: Replace hardcoded types with re-exports from generated types**

Replace the entire file contents. Keep `NewsSource` and `NewsSourcesContent` (used by FormatNewsSentiment and PDF report for news rendering, not part of generated types). Re-export the generated `Section`, `StockAnalysis`, and `StockAnalysisReportData`.

```typescript
// Re-export generated types as the source of truth
export type {
  StockAnalysis,
  StockAnalysisReportData,
  Section,
} from "@/api/generated/report-apis/models";

// These types are used by FormatNewsSentiment and PDF report for news source rendering.
// They are not part of the generated API types.
export type NewsSource = {
  dbId: number;
  title: string;
  type: string;
  description: string | null;
  guid: string;
  date: string;
  enclosure: number;
  link: string;
  sentimentScore: number;
  company?: {
    dbId: number;
    nse: string;
    [key: string]: any;
  };
};

export type NewsSourcesContent = {
  content: NewsSource[];
};
```

**Step 2: Verify no compile errors from consumers**

Run: `pnpm build 2>&1 | head -50`
Expected: Build errors in the 3 consumer files (stock-analysis.tsx, stock-analysis-download-dialog.tsx, stock-report.tsx) because they reference old flat paths like `data.business_overview`. This is expected and will be fixed in subsequent tasks.

**Step 3: Commit**

```bash
git add src/types/stock-analysis.ts
git commit -m "refactor: replace hardcoded stock analysis types with generated API types"
```

---

### Task 2: Create RiskMetricsTable Component

**Files:**
- Create: `src/components/thread/messages/client-components/RiskMetricsTable.tsx`

**Step 1: Create the component**

The risk_metrics data is an array of objects like `{Stats: "CAGR (%)", ICICIBANK: 4.242, NIFTY500: 3.838}`. The first column is always `Stats`, remaining columns are dynamic (stock ticker + benchmark).

```tsx
"use client";

import { cn } from "@/lib/utils";

type StatsRecord = Record<string, unknown>;

type Props = {
  data?: StatsRecord[] | null;
  className?: string;
};

/** Format a cell value for display */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "\u2014";
  if (typeof value === "string") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "\u2014";
    // If integer and large (like drawdown duration in days), no decimal
    if (Number.isInteger(value) && Math.abs(value) >= 10) return value.toLocaleString();
    // Otherwise 2-3 decimal places
    return value.toFixed(3).replace(/\.?0+$/, "") || "0";
  }
  return String(value);
}

/** Color class for numeric values */
function getValueColor(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-red-600";
  return "";
}

export default function RiskMetricsTable({ data, className }: Props) {
  if (!data || data.length === 0) return null;

  // Extract column headers from first row keys (Stats + dynamic columns)
  const columns = Object.keys(data[0]);
  const statsCol = columns[0]; // "Stats"
  const valueColumns = columns.slice(1);

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-200 bg-slate-50">
            {columns.map((col) => (
              <th
                key={col}
                className={cn(
                  "whitespace-nowrap px-3 py-2 font-semibold text-slate-700",
                  col === statsCol ? "text-left" : "text-right",
                )}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className={cn(
                "border-b border-slate-100 transition-colors hover:bg-slate-50/50",
                idx % 2 === 0 ? "bg-white" : "bg-slate-25",
              )}
            >
              <td className="whitespace-nowrap px-3 py-1.5 font-medium text-slate-700">
                {String(row[statsCol] ?? "")}
              </td>
              {valueColumns.map((col) => (
                <td
                  key={col}
                  className={cn(
                    "whitespace-nowrap px-3 py-1.5 text-right tabular-nums",
                    getValueColor(row[col]),
                  )}
                >
                  {formatCellValue(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/thread/messages/client-components/RiskMetricsTable.tsx
git commit -m "feat: add RiskMetricsTable component for stock technical analysis"
```

---

### Task 3: Create FundamentalChart Component

**Files:**
- Create: `src/components/thread/messages/client-components/FundamentalChart.tsx`

**Step 1: Create the component**

Generic chart that handles both `bar` and `line` chart_type from `FundamentalChartData`. Data shape: `{year: "2025", revenue: 186331, operating_profit: 58531, net_profit: null}` with `colors` map and `title`/`description`.

```tsx
"use client";

import type { FundamentalChartData } from "@/api/generated/report-apis/models";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  data: FundamentalChartData;
  className?: string;
  disableAnimation?: boolean;
};

/** Pretty-print a key like "operating_profit" to "Operating Profit" */
function formatKey(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Format large numbers (e.g. 186331 -> "1.86L" or "186,331") */
function formatValue(value: number): string {
  if (Math.abs(value) >= 100000) {
    return `${(value / 100000).toFixed(1)}L`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(1);
}

/** Check if a chart has at least one non-null data point across all series */
function hasValidData(
  data: Record<string, unknown>[],
  seriesKeys: string[],
): boolean {
  return data.some((row) =>
    seriesKeys.some((key) => row[key] !== null && row[key] !== undefined),
  );
}

export default function FundamentalChart({
  data: chartData,
  className,
  disableAnimation = false,
}: Props) {
  const { data, chart_type, colors, title, description } = chartData;

  // Determine series keys (all keys except "year")
  const seriesKeys = data.length > 0
    ? Object.keys(data[0]).filter((k) => k !== "year")
    : [];

  // Skip rendering if no valid data
  if (!hasValidData(data, seriesKeys)) return null;

  const colorsMap = (colors ?? {}) as Record<string, string>;
  const ChartComponent = chart_type === "line" ? LineChart : BarChart;

  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <h5 className="text-sm font-semibold text-slate-700">{title}</h5>
      )}
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={data as Record<string, any>[]}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={formatValue} />
          <Tooltip
            formatter={(value: number, name: string) => [
              value?.toLocaleString() ?? "\u2014",
              formatKey(name),
            ]}
          />
          <Legend formatter={formatKey} />
          {seriesKeys.map((key) =>
            chart_type === "line" ? (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colorsMap[key] || "#035BFF"}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
                isAnimationActive={!disableAnimation}
              />
            ) : (
              <Bar
                key={key}
                dataKey={key}
                fill={colorsMap[key] || "#035BFF"}
                radius={[2, 2, 0, 0]}
                isAnimationActive={!disableAnimation}
              />
            ),
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/thread/messages/client-components/FundamentalChart.tsx
git commit -m "feat: add FundamentalChart component for revenue/profit and margin charts"
```

---

### Task 4: Create PeerComparisonChart Component

**Files:**
- Create: `src/components/thread/messages/client-components/PeerComparisonChart.tsx`

**Step 1: Create the component**

Grouped bar chart from `PeerChartData`. Data shape: `{company: "HDFC Bank Ltd.", pe: 18.14, pb: null, ev_ebitda: null}` with `metrics`, `colors`, `highlighted_company`, `title`, `description`.

```tsx
"use client";

import type { PeerChartData } from "@/api/generated/report-apis/models";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  data: PeerChartData;
  className?: string;
  disableAnimation?: boolean;
};

/** Pretty-print metric keys */
function formatMetric(key: string): string {
  const labels: Record<string, string> = {
    pe: "P/E",
    pb: "P/B",
    ev_ebitda: "EV/EBITDA",
    roe: "ROE",
    roce: "ROCE",
    op_margin: "Op. Margin",
  };
  return labels[key] ?? key.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/** Truncate long company names */
function truncateCompany(name: string, max = 15): string {
  if (name.length <= max) return name;
  return name.slice(0, max - 1) + "\u2026";
}

/** Check if chart has any valid data points */
function hasValidData(
  data: Record<string, unknown>[],
  metrics: string[],
): boolean {
  return data.some((row) =>
    metrics.some(
      (m) => row[m] !== null && row[m] !== undefined && row[m] !== 0,
    ),
  );
}

export default function PeerComparisonChart({
  data: chartData,
  className,
  disableAnimation = false,
}: Props) {
  const { data, metrics, colors, highlighted_company, title, description } =
    chartData;

  const colorsMap = (colors ?? {}) as Record<string, string>;

  // Skip rendering if no valid data
  if (!hasValidData(data, metrics)) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <h5 className="text-sm font-semibold text-slate-700">{title}</h5>
      )}
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data as Record<string, any>[]}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="company"
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => truncateCompany(v)}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number, name: string) => [
              value?.toFixed(2) ?? "\u2014",
              formatMetric(name),
            ]}
          />
          <Legend formatter={formatMetric} />
          {metrics.map((metric) => (
            <Bar
              key={metric}
              dataKey={metric}
              fill={colorsMap[metric] || "#035BFF"}
              radius={[2, 2, 0, 0]}
              isAnimationActive={!disableAnimation}
            >
              {data.map((entry, idx) => {
                const isHighlighted =
                  (entry as Record<string, any>).company
                    ?.toUpperCase()
                    .includes(highlighted_company?.toUpperCase());
                return (
                  <Cell
                    key={idx}
                    fillOpacity={isHighlighted ? 1 : 0.6}
                    stroke={isHighlighted ? colorsMap[metric] || "#035BFF" : "none"}
                    strokeWidth={isHighlighted ? 2 : 0}
                  />
                );
              })}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/thread/messages/client-components/PeerComparisonChart.tsx
git commit -m "feat: add PeerComparisonChart component for valuation and profitability comparisons"
```

---

### Task 5: Rewrite Stock Analysis Chat Component

**Files:**
- Modify: `src/components/thread/messages/client-components/stock-analysis.tsx`

This is the main chat component. Restructure from flat sections to 7 grouped card-based sections.

**Step 1: Rewrite the component**

The component receives `StockAnalysis` props (same top-level shape: `id, ticker, company_name, data, date`). The `data` field now has the grouped structure.

Key changes:
- Import types from generated API models
- Import reusable chart components
- Import new chart components (FundamentalChart, PeerComparisonChart, RiskMetricsTable)
- Add `ACCENT_BORDER` map and `SectionCard` helper (same pattern as pf-analysis.tsx:34-396)
- Render 7 grouped sections in cards
- Keep Back to Top button and Download dialog
- Use `FormatNewsSentiment` for news_sentiment (it already handles the NewsSourcesContent format)
- Use `SectionFormatter` for text sections within each group
- Handle nullable fields gracefully

The file should import these:
```
- StockAnalysis, StockAnalysisReportData from generated types
- Section from generated types
- SectionFormatter from @/lib/section-formatter
- MarkdownText from markdown-text
- FormatNewsSentiment from format-news-sentiment
- LineChart, DrawdownChart, SimulationChart (existing)
- MonthlyReturnsHeatmapTables from pf-report/MonthlyReturnsHeatmap
- FinSharpeScoresRadarChart from pf-report/FinSharpeScoresRadarChart
- OverallScorePie, RiskScorePie from modules/core/portfolio/charts
- FundamentalChart, PeerComparisonChart, RiskMetricsTable (new)
- Button from ui/button, ArrowUp from lucide-react
- useQueryState from nuqs, useRef from react
- StockAnalysisDownloadDialog
```

The full component structure:

```tsx
"use client";

import type {
  FundamentalChartData,
  PeerChartData,
  ScoreSection,
  StockAnalysis,
} from "@/api/generated/report-apis/models";
import FinSharpeScoresRadarChart from "@/components/pdfs_templates/pf-report/FinSharpeScoresRadarChart";
import { MonthlyReturnsHeatmapTables } from "@/components/pdfs_templates/pf-report/MonthlyReturnsHeatmap";
import { Button } from "@/components/ui/button";
import { SectionFormatter } from "@/lib/section-formatter";
import type { MonthlyReturnsHeatmapData } from "@/types/pf-analysis";
import type { Section } from "@/types/stock-analysis";
import OverallScorePie from "@/modules/core/portfolio/charts/OverallScorePie";
import RiskScorePie from "@/modules/core/portfolio/charts/RiskScorePie";
import { ArrowUp } from "lucide-react";
import { useQueryState } from "nuqs";
import { useRef } from "react";
import { MarkdownText } from "../../markdown-text";
import DrawdownChart from "./DrawdownChart";
import FundamentalChart from "./FundamentalChart";
import { FormatNewsSentiment } from "./format-news-sentiment";
import LineChart from "./LineChart";
import PeerComparisonChart from "./PeerComparisonChart";
import RiskMetricsTable from "./RiskMetricsTable";
import SimulationChart from "./SimulationChart";
import { StockAnalysisDownloadDialog } from "./stock-analysis-download-dialog";

// Full class names so Tailwind JIT can detect them
const ACCENT_BORDER: Record<string, string> = {
  indigo: "border-l-indigo-500",
  rose: "border-l-rose-500",
  amber: "border-l-amber-500",
  cyan: "border-l-cyan-500",
  emerald: "border-l-emerald-500",
  violet: "border-l-violet-500",
  slate: "border-l-slate-400",
};

export default function StockAnalysisComponent(analysis: StockAnalysis) {
  const [threadId] = useQueryState("threadId");
  const { data } = analysis;
  const topRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={topRef} className="space-y-6">
      {/* 1. Company Overview */}
      <SectionCard accent="indigo">
        <FormatSection section={data.company_overview.business_overview} seqNumber={1} />
        {data.company_overview.management_strategy && (
          <FormatSection section={data.company_overview.management_strategy as Section} />
        )}
        <FormatSection section={data.company_overview.sector_outlook} />
      </SectionCard>

      {/* 2. Technical Analysis */}
      <SectionCard accent="rose">
        <FormatSection section={data.technical_analysis.analysis} seqNumber={2} />
        {data.technical_analysis.returns_chart && (
          <LineChart
            {...(data.technical_analysis.returns_chart as Record<string, any>)}
          />
        )}
        {data.technical_analysis.drawdown_chart && (
          <DrawdownChart
            data={data.technical_analysis.drawdown_chart as any}
          />
        )}
        {data.technical_analysis.monthly_returns && (
          <div className="space-y-2">
            {(data.technical_analysis.monthly_returns as any)?.heatmap && (
              <div className="overflow-x-auto">
                <MonthlyReturnsHeatmapTables
                  heatmap={(data.technical_analysis.monthly_returns as any).heatmap as MonthlyReturnsHeatmapData}
                />
              </div>
            )}
            {(data.technical_analysis.monthly_returns as any)?.summary && (
              <MarkdownText>
                {(data.technical_analysis.monthly_returns as any).summary}
              </MarkdownText>
            )}
          </div>
        )}
        {data.technical_analysis.rolling_sortino_chart && (
          <LineChart
            {...(data.technical_analysis.rolling_sortino_chart as Record<string, any>)}
          />
        )}
        {data.technical_analysis.risk_metrics && (
          <RiskMetricsTable
            data={data.technical_analysis.risk_metrics as Record<string, unknown>[]}
          />
        )}
      </SectionCard>

      {/* 3. Fundamental Analysis */}
      <SectionCard accent="amber">
        <FormatSection section={data.fundamental_analysis.analysis} seqNumber={3} />
        {data.fundamental_analysis.revenue_profit_chart && (
          <FundamentalChart
            data={data.fundamental_analysis.revenue_profit_chart as FundamentalChartData}
          />
        )}
        {data.fundamental_analysis.margin_chart && (
          <FundamentalChart
            data={data.fundamental_analysis.margin_chart as FundamentalChartData}
          />
        )}
      </SectionCard>

      {/* 4. Peer Comparison */}
      <SectionCard accent="cyan">
        <FormatSection section={data.peer_comparison.analysis} seqNumber={4} />
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
      </SectionCard>

      {/* 5. Market Sentiment */}
      <SectionCard accent="emerald">
        <FormatNewsSentiment section={data.market_sentiment.news_sentiment} seqNumber={5} />
        {data.market_sentiment.conference_call && (
          <FormatSection section={data.market_sentiment.conference_call as Section} />
        )}
        {data.market_sentiment.corporate_actions && (
          <FormatSection section={data.market_sentiment.corporate_actions as Section} />
        )}
        <FormatSection section={data.market_sentiment.shareholding_pattern} />
      </SectionCard>

      {/* 6. FinSharpe Analysis */}
      {data.finsharpe_analysis && (
        <SectionCard accent="violet">
          <FormatSection
            section={(data.finsharpe_analysis as any).analysis}
            seqNumber={6}
          />
          {(data.finsharpe_analysis as any).sections?.map(
            (scoreSection: ScoreSection, idx: number) => {
              if (scoreSection.chart_type === "radar") {
                return (
                  <FinSharpeScoresRadarChart
                    key={idx}
                    data={scoreSection.scores_comparison}
                    className="mx-auto h-80 max-w-lg"
                  />
                );
              }
              if (scoreSection.chart_type === "gauge") {
                const isRisk = scoreSection.title
                  ?.toLowerCase()
                  .includes("risk");
                const PieComponent = isRisk ? RiskScorePie : OverallScorePie;
                return (
                  <div key={idx} className="space-y-2">
                    <h5 className="text-sm font-semibold text-slate-700">
                      {scoreSection.title}
                    </h5>
                    {scoreSection.summary && (
                      <p className="text-xs text-slate-500">
                        {scoreSection.summary}
                      </p>
                    )}
                    <PieComponent data={scoreSection.chart_data} />
                  </div>
                );
              }
              return null;
            },
          )}
        </SectionCard>
      )}

      {/* 7. Outlook */}
      <SectionCard accent="slate">
        <FormatSection section={data.outlook.summary} seqNumber={7} />
        <FormatSection section={data.outlook.red_flags} />
        {data.outlook.simulation_chart && (
          <SimulationChart {...(data.outlook.simulation_chart as any)} />
        )}
      </SectionCard>

      {/* Footer actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() =>
            topRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
        >
          <ArrowUp className="mr-2 h-4 w-4" />
          Back to Top
        </Button>
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

function SectionCard({
  accent = "indigo",
  children,
  className = "",
}: {
  accent?: keyof typeof ACCENT_BORDER;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`space-y-4 rounded-xl border border-l-4 border-slate-200 ${ACCENT_BORDER[accent]} bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function FormatSection({
  section,
  seqNumber,
}: {
  section: Section;
  seqNumber?: number;
}) {
  if (!section) return null;

  const formatter = new SectionFormatter(section, seqNumber);
  return <MarkdownText>{formatter.getMarkdown()}</MarkdownText>;
}
```

**Note:** The `FormatTechnicalAnalysis` function from the old file is no longer needed since technical analysis charts are rendered directly in the card.

**Step 2: Verify the component builds**

Run: `pnpm build 2>&1 | head -50`
Expected: May still have errors in download-dialog and stock-report (fixed in next tasks). The stock-analysis.tsx itself should not have type errors.

**Step 3: Commit**

```bash
git add src/components/thread/messages/client-components/stock-analysis.tsx
git commit -m "feat: restructure stock analysis chat component for grouped schema with card layout"
```

---

### Task 6: Update Download Dialog

**Files:**
- Modify: `src/components/thread/messages/client-components/stock-analysis-download-dialog.tsx`

**Step 1: Update STOCK_SECTIONS array**

Replace the old 14-item flat section list with the new 7 grouped section keys:

```typescript
const STOCK_SECTIONS: StockAnalysisSection[] = [
  { key: "company_overview", label: "Company Overview" },
  { key: "technical_analysis", label: "Technical Analysis" },
  { key: "fundamental_analysis", label: "Fundamental Analysis" },
  { key: "peer_comparison", label: "Peer Comparison" },
  { key: "market_sentiment", label: "Market Sentiment" },
  { key: "finsharpe_analysis", label: "FinSharpe Analysis" },
  { key: "outlook", label: "Outlook" },
];
```

No other changes needed in this file - the download dialog just passes section keys to the API.

**Step 2: Commit**

```bash
git add src/components/thread/messages/client-components/stock-analysis-download-dialog.tsx
git commit -m "feat: update download dialog section keys for grouped schema"
```

---

### Task 7: Rewrite PDF Report Component

**Files:**
- Modify: `src/components/pdfs_templates/stock-report/stock-report.tsx`

This is the PDF report renderer. Same restructuring as the chat component but with PDF-specific styling and the Data Sources section at the bottom.

**Step 1: Rewrite the component**

Key changes:
- Navigate grouped paths instead of flat paths
- Add chart rendering for new chart types (same components as chat, with `disableAnimation` for PDF)
- Update the Data Sources section to iterate over grouped paths
- `shouldRenderSection` now uses the 7 grouped keys
- Keep the `Welcome` component at top
- Keep the personal comment section
- Use `FormatNewsSentiment` with `variant="pdf"` for news sentiment

The sections array becomes:

```typescript
const sections = [
  {
    key: "company_overview",
    render: (seqNumber: number) => (
      <>
        <FormatSection section={data.company_overview.business_overview} seqNumber={seqNumber} />
        {data.company_overview.management_strategy && (
          <FormatSection section={data.company_overview.management_strategy as Section} />
        )}
        <FormatSection section={data.company_overview.sector_outlook} />
      </>
    ),
  },
  {
    key: "technical_analysis",
    render: (seqNumber: number) => (
      <>
        <FormatTechnicalSection section={data.technical_analysis.analysis} seqNumber={seqNumber} />
        {data.technical_analysis.returns_chart && (
          <LineChart {...(data.technical_analysis.returns_chart as any)} disableAnimation />
        )}
        {data.technical_analysis.drawdown_chart && (
          <DrawdownChart data={data.technical_analysis.drawdown_chart as any} disableAnimation />
        )}
        {data.technical_analysis.monthly_returns && (data.technical_analysis.monthly_returns as any)?.heatmap && (
          <MonthlyReturnsHeatmapTables
            heatmap={(data.technical_analysis.monthly_returns as any).heatmap}
          />
        )}
        {data.technical_analysis.rolling_sortino_chart && (
          <LineChart {...(data.technical_analysis.rolling_sortino_chart as any)} disableAnimation />
        )}
        {data.technical_analysis.risk_metrics && (
          <RiskMetricsTable data={data.technical_analysis.risk_metrics as any} />
        )}
      </>
    ),
  },
  {
    key: "fundamental_analysis",
    render: (seqNumber: number) => (
      <>
        <FormatSection section={data.fundamental_analysis.analysis} seqNumber={seqNumber} />
        {data.fundamental_analysis.revenue_profit_chart && (
          <FundamentalChart data={data.fundamental_analysis.revenue_profit_chart as FundamentalChartData} disableAnimation />
        )}
        {data.fundamental_analysis.margin_chart && (
          <FundamentalChart data={data.fundamental_analysis.margin_chart as FundamentalChartData} disableAnimation />
        )}
      </>
    ),
  },
  {
    key: "peer_comparison",
    render: (seqNumber: number) => (
      <>
        <FormatSection section={data.peer_comparison.analysis} seqNumber={seqNumber} />
        {data.peer_comparison.valuation_chart && (
          <PeerComparisonChart data={data.peer_comparison.valuation_chart as PeerChartData} disableAnimation />
        )}
        {data.peer_comparison.profitability_chart && (
          <PeerComparisonChart data={data.peer_comparison.profitability_chart as PeerChartData} disableAnimation />
        )}
      </>
    ),
  },
  {
    key: "market_sentiment",
    render: (seqNumber: number) => (
      <>
        <FormatNewsSentiment section={data.market_sentiment.news_sentiment} variant="pdf" seqNumber={seqNumber} />
        {data.market_sentiment.conference_call && (
          <FormatSection section={data.market_sentiment.conference_call as Section} />
        )}
        {data.market_sentiment.corporate_actions && (
          <FormatSection section={data.market_sentiment.corporate_actions as Section} />
        )}
        <FormatSection section={data.market_sentiment.shareholding_pattern} />
      </>
    ),
  },
  {
    key: "finsharpe_analysis",
    render: (seqNumber: number) => {
      if (!data.finsharpe_analysis) return null;
      const fa = data.finsharpe_analysis as any;
      return (
        <>
          <FormatSection section={fa.analysis} seqNumber={seqNumber} />
          {fa.sections?.map((s: ScoreSection, idx: number) => {
            if (s.chart_type === "radar") {
              return <FinSharpeScoresRadarChart key={idx} data={s.scores_comparison} />;
            }
            if (s.chart_type === "gauge") {
              const isRisk = s.title?.toLowerCase().includes("risk");
              const PieComp = isRisk ? RiskScorePie : OverallScorePie;
              return (
                <div key={idx} className="space-y-2">
                  <h5 className="text-sm font-semibold">{s.title}</h5>
                  {s.summary && <p className="text-xs text-gray-500">{s.summary}</p>}
                  <PieComp data={s.chart_data} />
                </div>
              );
            }
            return null;
          })}
        </>
      );
    },
  },
  {
    key: "outlook",
    render: (seqNumber: number) => (
      <>
        <FormatSection section={data.outlook.summary} seqNumber={seqNumber} />
        <FormatSection section={data.outlook.red_flags} />
        {data.outlook.simulation_chart && (
          <SimulationChart {...(data.outlook.simulation_chart as any)} />
        )}
      </>
    ),
  },
];
```

The Data Sources section at the bottom needs updating to use the grouped paths. Build a flat list of sections that have sources:

```typescript
const sourceSections = [
  { section: data.company_overview.business_overview, key: "company_overview" },
  { section: data.company_overview.management_strategy as Section | null, key: "company_overview" },
  { section: data.company_overview.sector_outlook, key: "company_overview" },
  { section: data.technical_analysis.analysis, key: "technical_analysis" },
  { section: data.fundamental_analysis.analysis, key: "fundamental_analysis" },
  { section: data.peer_comparison.analysis, key: "peer_comparison" },
  { section: data.market_sentiment.news_sentiment, key: "market_sentiment", isNews: true },
  { section: data.market_sentiment.conference_call as Section | null, key: "market_sentiment" },
  { section: data.market_sentiment.corporate_actions as Section | null, key: "market_sentiment" },
  { section: data.market_sentiment.shareholding_pattern, key: "market_sentiment" },
  { section: data.finsharpe_analysis ? (data.finsharpe_analysis as any).analysis : null, key: "finsharpe_analysis" },
]
  .filter(({ key, section }) => section && shouldRenderSection(key));
```

**Step 2: Verify build**

Run: `pnpm build 2>&1 | head -50`
Expected: PASS (all files updated)

**Step 3: Commit**

```bash
git add src/components/pdfs_templates/stock-report/stock-report.tsx
git commit -m "feat: restructure PDF stock report for grouped schema with chart support"
```

---

### Task 8: Verify Full Build & Manual Test

**Step 1: Run full build**

Run: `pnpm build`
Expected: Build succeeds with no type errors.

**Step 2: Run lint**

Run: `pnpm lint`
Expected: No errors (warnings acceptable).

**Step 3: Manual verification with props.json**

To verify rendering, temporarily update the props.json import or test in dev mode:
Run: `pnpm dev`

Open the app and trigger a stock analysis to verify:
- All 7 grouped sections render in cards
- Charts render (returns, drawdown, monthly returns heatmap, rolling sortino, fundamental, peer comparison)
- Risk metrics table displays correctly
- FinSharpe radar + gauge charts render
- Null fields gracefully hidden
- Download dialog shows 7 section checkboxes
- PDF report generates correctly

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete stock report schema migration to grouped structure"
```

---

## Task Dependency Graph

```
Task 1 (types) ──────────────────────┐
Task 2 (RiskMetricsTable) ───────────┤
Task 3 (FundamentalChart) ───────────┼── Task 5 (stock-analysis.tsx) ─── Task 8 (verify)
Task 4 (PeerComparisonChart) ────────┤         │
                                     │   Task 6 (download-dialog)
                                     │         │
                                     └── Task 7 (stock-report.tsx) ──── Task 8
```

Tasks 1-4 can be done in parallel. Task 5 depends on Tasks 1-4. Tasks 6-7 depend on Task 1. Task 8 is the final verification.
