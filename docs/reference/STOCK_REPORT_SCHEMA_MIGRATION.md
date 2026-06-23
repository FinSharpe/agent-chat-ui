# Stock Report Schema Migration Guide

> **For**: Frontend team
> **Date**: March 2026
> **Breaking Change**: Yes — the `stock_analysis` UI component payload has a new structure.

## Summary

The stock analysis report schema has been redesigned from a **flat structure** (14 top-level `Section` fields) to a **grouped structure** with 7 logical groups, each containing text analysis + optional chart data.

The component name (`stock_analysis`) and top-level fields (`id`, `ticker`, `company_name`, `date`) remain the same.

---

## What Changed

### Old Schema (flat)

```typescript
interface StockAnalysisReportData {
  // All flat Section fields
  business_overview: Section
  management_strategy: Section
  sector_outlook: Section
  technical_analysis: Section
  fundamental_analysis: Section
  peer_comparison: Section
  conference_call_analysis: Section
  corporate_actions: Section
  news_sentiment: Section
  shareholding_pattern: Section
  finsharpe_scores: Section
  summary: Section
  red_flags: Section
  simulation_chart: dict | null
}
```

### New Schema (grouped)

```typescript
interface StockAnalysisReportData {
  company_overview: CompanyOverviewGroup
  technical_analysis: TechnicalAnalysisGroup
  fundamental_analysis: FundamentalAnalysisGroup
  peer_comparison: PeerComparisonGroup
  market_sentiment: MarketSentimentGroup
  finsharpe_analysis: StockFinSharpeAnalysisData | null
  outlook: OutlookGroup
}
```

---

## New Type Definitions

### Shared types (already exist from Portfolio Report)

```typescript
// schemas/report/common.py
interface Section {
  title: string
  content: string
  in_depth_analysis?: string | null
  sources?: Record<string, any> | any[] | string | null
}

// schemas/report/pf_report.py — reused from portfolio report
interface ScoreSection {
  title: string
  summary: string                          // LLM-generated summary
  chart_type: "radar" | "gauge"
  scores_comparison: FinSharpeScoreItem[]   // only for radar
  chart_data: ScoreChartDataItem[]          // only for gauge
}

interface MonthlyReturnsSection {
  heatmap: Record<string, any> | null
  summary: string
}

// schemas/api/portfolio_analytics.py — reused
interface FinSharpeScoreItem {
  metric: string
  portfolio: number    // stock's score (not portfolio — field name kept for compatibility)
  industry: number
}

interface ScoreChartDataItem {
  label: string
  value: number
}
```

### New chart data types

```typescript
interface FundamentalChartData {
  data: Record<string, any>[]   // e.g. [{year: "2021", revenue: 100, ...}]
  chart_type: "bar" | "line"
  colors: Record<string, string>  // series name → hex color
  title: string
  description: string
}

interface PeerChartData {
  data: Record<string, any>[]   // e.g. [{company: "INFY", pe: 25, ...}]
  metrics: string[]              // metric keys shown in chart
  colors: Record<string, string> // metric name → hex color
  highlighted_company: string    // ticker to highlight
  title: string
  description: string
}
```

### Grouped section types

```typescript
interface CompanyOverviewGroup {
  business_overview: Section
  management_strategy: Section | null   // null when no data available
  sector_outlook: Section
}

interface TechnicalAnalysisGroup {
  analysis: Section                              // text analysis (from ZoneBack)
  returns_chart: ReturnsChartData | null         // cumulative returns (stock vs Nifty 500)
  drawdown_chart: DrawdownChartData | null       // underwater plot + worst periods
  monthly_returns: MonthlyReturnsSection | null  // heatmap + summary
  rolling_sortino_chart: ReturnsChartData | null // rolling 1Y Sortino ratio
  risk_metrics: StatsMetric[] | null             // Sharpe, Sortino, Max DD, etc.
}

interface FundamentalAnalysisGroup {
  analysis: Section                                  // text analysis
  revenue_profit_chart: FundamentalChartData | null  // bar chart: revenue, op profit, net profit
  margin_chart: FundamentalChartData | null          // line chart: operating margin, net margin
}

interface PeerComparisonGroup {
  analysis: Section                                // text analysis
  valuation_chart: PeerChartData | null            // P/E, P/B, EV/EBITDA bars
  profitability_chart: PeerChartData | null        // ROE, ROCE, Op Margin bars
}

interface MarketSentimentGroup {
  news_sentiment: Section
  conference_call: Section | null     // null when no data
  corporate_actions: Section | null   // null when no data
  shareholding_pattern: Section
}

interface StockFinSharpeAnalysisData {
  analysis: Section                    // text analysis
  sections: ScoreSection[]             // [radar, overall_gauge, risk_gauge]
}

interface OutlookGroup {
  summary: Section
  red_flags: Section
  simulation_chart: SimulationChart | null  // Monte Carlo simulation
}
```

### Top-level (unchanged shape)

```typescript
interface StockAnalysis {
  id: string
  ticker: string
  company_name: string
  data: StockAnalysisReportData
  date: string
}
```

---

## Field Mapping: Old → New

| Old field path | New field path |
|----------------|----------------|
| `data.business_overview` | `data.company_overview.business_overview` |
| `data.management_strategy` | `data.company_overview.management_strategy` (**now nullable**) |
| `data.sector_outlook` | `data.company_overview.sector_outlook` |
| `data.technical_analysis` | `data.technical_analysis.analysis` |
| *(new)* | `data.technical_analysis.returns_chart` |
| *(new)* | `data.technical_analysis.drawdown_chart` |
| *(new)* | `data.technical_analysis.monthly_returns` |
| *(new)* | `data.technical_analysis.rolling_sortino_chart` |
| *(new)* | `data.technical_analysis.risk_metrics` |
| `data.fundamental_analysis` | `data.fundamental_analysis.analysis` |
| *(new)* | `data.fundamental_analysis.revenue_profit_chart` |
| *(new)* | `data.fundamental_analysis.margin_chart` |
| `data.peer_comparison` | `data.peer_comparison.analysis` |
| *(new)* | `data.peer_comparison.valuation_chart` |
| *(new)* | `data.peer_comparison.profitability_chart` |
| `data.news_sentiment` | `data.market_sentiment.news_sentiment` |
| `data.conference_call_analysis` | `data.market_sentiment.conference_call` (**now nullable**) |
| `data.corporate_actions` | `data.market_sentiment.corporate_actions` (**now nullable**) |
| `data.shareholding_pattern` | `data.market_sentiment.shareholding_pattern` |
| `data.finsharpe_scores` | `data.finsharpe_analysis.analysis` (**now has charts**) |
| *(new)* | `data.finsharpe_analysis.sections` (radar + gauges) |
| `data.summary` | `data.outlook.summary` |
| `data.red_flags` | `data.outlook.red_flags` |
| `data.simulation_chart` | `data.outlook.simulation_chart` |

---

## Chart Data Formats

### returns_chart / rolling_sortino_chart

Same format as portfolio report's `returns_chart`:

```json
{
  "data": [
    {"date": 1672531200000, "INFY": 0.05, "NIFTY500": 0.03},
    {"date": 1672617600000, "INFY": 0.06, "NIFTY500": 0.04}
  ],
  "colors": {"INFY": "#035BFF", "NIFTY500": "#46D7A7"},
  "title": "Cumulative Returns - INFY vs NIFTY500",
  "description": "This chart shows..."
}
```

### drawdown_chart

Same format as portfolio report's drawdown chart:

```json
{
  "underwater_plot": [
    {"date": 1672531200000, "INFY": -0.05, "NIFTY500": -0.02}
  ],
  "worst_periods": [
    {"start_date": 1672531200000, "end_date": 1675209600000, "drawdown_pct": -15.3}
  ],
  "colors": {"INFY": "#035BFF", "NIFTY500": "#46D7A7"},
  "title": "Drawdown Analysis - INFY vs NIFTY500",
  "description": "Drawdown analysis..."
}
```

### monthly_returns (heatmap)

Same format as portfolio report's `monthly_returns`:

```json
{
  "heatmap": {
    "months": ["Jan", "Feb", "Mar", ...],
    "portfolio": [{"year": 2024, "Jan": 2.5, "Feb": -1.3, ...}],
    "benchmark": [{"year": 2024, "Jan": 1.8, "Feb": -0.9, ...}],
    "active": [{"year": 2024, "Jan": 0.7, "Feb": -0.4, ...}]
  },
  "summary": "The stock consistently outperformed..."
}
```

### risk_metrics

Array of stat records:

```json
[
  {"Stats": "CAGR", "INFY": 0.156, "NIFTY500": 0.123},
  {"Stats": "Sharpe Ratio", "INFY": 1.23, "NIFTY500": 0.95},
  {"Stats": "Max Drawdown", "INFY": -0.312, "NIFTY500": -0.254}
]
```

### revenue_profit_chart (FundamentalChartData)

```json
{
  "data": [
    {"year": "2021", "revenue": 70000, "operating_profit": 18000, "net_profit": 14000},
    {"year": "2022", "revenue": 82000, "operating_profit": 21000, "net_profit": 16500}
  ],
  "chart_type": "bar",
  "colors": {"revenue": "#035BFF", "operating_profit": "#46D7A7", "net_profit": "#FFA500"},
  "title": "Revenue & Profit Trend",
  "description": "Annual revenue, operating profit, and net profit trend."
}
```

### margin_chart (FundamentalChartData)

```json
{
  "data": [
    {"year": "2021", "operating_margin": 25.7, "net_margin": 20.0},
    {"year": "2022", "operating_margin": 25.6, "net_margin": 20.1}
  ],
  "chart_type": "line",
  "colors": {"operating_margin": "#035BFF", "net_margin": "#46D7A7"},
  "title": "Margin Trend",
  "description": "Annual operating margin and net margin trend."
}
```

### valuation_chart / profitability_chart (PeerChartData)

```json
{
  "data": [
    {"company": "Infosys", "pe": 25.3, "pb": 7.2, "ev_ebitda": 18.5},
    {"company": "TCS", "pe": 30.1, "pb": 12.4, "ev_ebitda": 22.3}
  ],
  "metrics": ["pe", "pb", "ev_ebitda"],
  "colors": {"pe": "#035BFF", "pb": "#46D7A7", "ev_ebitda": "#FFA500"},
  "highlighted_company": "INFY",
  "title": "Valuation Comparison",
  "description": "P/E, P/B, and EV/EBITDA comparison across peers."
}
```

### finsharpe_analysis.sections

Array of 3 `ScoreSection` items — same format as portfolio report:

```json
[
  {
    "title": "FinSharpe Score Comparison",
    "summary": "",
    "chart_type": "radar",
    "scores_comparison": [
      {"metric": "Overall Score", "portfolio": 72.5, "industry": 55.3},
      {"metric": "Growth Score", "portfolio": 68.0, "industry": 50.1}
    ],
    "chart_data": []
  },
  {
    "title": "Overall Score",
    "summary": "INFY has an Overall Score of 72.5, indicating...",
    "chart_type": "gauge",
    "scores_comparison": [],
    "chart_data": [
      {"label": "Overall Score", "value": 72.5},
      {"label": "Total", "value": 27.5}
    ]
  },
  {
    "title": "Risk Score",
    "summary": "INFY's Risk Score of 45.2 indicates moderate risk...",
    "chart_type": "gauge",
    "scores_comparison": [],
    "chart_data": [
      {"label": "Risk Score", "value": 45.2},
      {"label": "Total", "value": 54.8}
    ]
  }
]
```

---

## Frontend Changes Required

### 1. Update TypeScript types

Generate types from the new dummy endpoint at `GET /api/reports/stock-analysis` or manually update the `StockAnalysis` type to match the grouped structure above.

### 2. Remove hardcoded types — use generated types instead

Delete the following hardcoded types from `src/types/stock-analysis.ts`:

- `NewsSource`
- `NewsSourcesContent`
- `Section`
- `StockAnalysisReportData`
- `StockAnalysis` (and any other sub-types in that file)

Replace them with the auto-generated types from the `/api/reports/stock-analysis` endpoint. The generated types will match the new grouped schema exactly.

### 3. Update the stock analysis component

The component receiving the `stock_analysis` UI message needs to navigate the new grouped paths:

```diff
- {data.business_overview.content}
+ {data.company_overview.business_overview.content}

- {data.technical_analysis.content}
+ {data.technical_analysis.analysis.content}

- {data.finsharpe_scores.content}
+ {data.finsharpe_analysis?.analysis.content}

- {data.summary.content}
+ {data.outlook.summary.content}

- {data.simulation_chart}
+ {data.outlook.simulation_chart}
```

### 4. Add new chart components

The following chart sections are **new** and need frontend components:

| Chart | Group | Type | Reusable from PF report? |
|-------|-------|------|--------------------------|
| Returns chart | `technical_analysis.returns_chart` | Line chart | Yes — same as PF `returns_chart` |
| Drawdown chart | `technical_analysis.drawdown_chart` | Line + periods | Yes — same as PF `drawdown` |
| Monthly returns heatmap | `technical_analysis.monthly_returns` | Heatmap | Yes — same as PF `monthly_returns` |
| Rolling Sortino | `technical_analysis.rolling_sortino_chart` | Line chart | Yes — same format as returns chart |
| Risk metrics table | `technical_analysis.risk_metrics` | Table | New (array of stat records) |
| Revenue/Profit chart | `fundamental_analysis.revenue_profit_chart` | Bar chart | New (`FundamentalChartData`) |
| Margin chart | `fundamental_analysis.margin_chart` | Line chart | New (`FundamentalChartData`) |
| Valuation comparison | `peer_comparison.valuation_chart` | Grouped bar | New (`PeerChartData`) |
| Profitability comparison | `peer_comparison.profitability_chart` | Grouped bar | New (`PeerChartData`) |
| FinSharpe radar | `finsharpe_analysis.sections[0]` | Radar chart | Yes — same as PF `ScoreSection` |
| FinSharpe overall gauge | `finsharpe_analysis.sections[1]` | Gauge chart | Yes — same as PF `ScoreSection` |
| FinSharpe risk gauge | `finsharpe_analysis.sections[2]` | Gauge chart | Yes — same as PF `ScoreSection` |

### 5. Handle nullable fields

These fields are now nullable (render nothing or a fallback when `null`):

- `data.company_overview.management_strategy` — null when no management strategy data found
- `data.market_sentiment.conference_call` — null when no conference call data
- `data.market_sentiment.corporate_actions` — null when no corporate actions
- `data.finsharpe_analysis` — null when ticker not found in screener
- All chart fields (`returns_chart`, `drawdown_chart`, etc.) — null when data unavailable

### 6. Suggested section rendering order

```
1. Company Overview
   └─ Business Overview → Management Strategy (if present) → Sector Outlook

2. Technical Analysis
   └─ Text Analysis → Returns Chart → Drawdown Chart → Monthly Returns Heatmap
      → Rolling Sortino → Risk Metrics Table

3. Fundamental Analysis
   └─ Text Analysis → Revenue & Profit Chart → Margin Chart

4. Peer Comparison
   └─ Text Analysis → Valuation Chart → Profitability Chart

5. Market Sentiment
   └─ News Sentiment → Conference Call (if present) → Corporate Actions (if present)
      → Shareholding Pattern

6. FinSharpe Analysis (if present)
   └─ Text Analysis → Radar Chart → Overall Score Gauge → Risk Score Gauge

7. Outlook
   └─ Summary → Red Flags → Simulation Chart (if present)
```
