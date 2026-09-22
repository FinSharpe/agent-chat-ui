import { StrategyAnalyticsResponse } from "@/api/generated/strategy-apis/models";
import { PortfolioMetric } from "@/modules/core/portfolio/constants/portfolio-metrics";
import { getStatValue } from "@/modules/core/portfolio/utils/get-stat-value";
import {
  PLACEHOLDER_MIN_INVESTMENT,
  placeholderBenchmark,
  placeholderHoldings,
  placeholderKeyMetrics,
  placeholderMarketCapAllocation,
  placeholderPerformance,
  placeholderRisk,
  placeholderSectorAllocation,
} from "../constants/strategy-detail-placeholder";
import {
  AllocationItem,
  ChartSeries,
  DetailRow,
  IdeaStrategy,
  StrategyDetailModel,
} from "../types/discover.types";
import { formatPct, formatRatio, toNumber } from "./format";

/* Reference chart palette: the strategy in brand blue, the benchmark in mint,
   anything else a dashed navy. */
const SERIES_COLORS = ["#063BAA", "#97edcc", "#455578"];

/** Advisor strategies carry this minimum; the API does not return one. */
const ADVISOR_MIN_INVESTMENT = "₹50L+";

const PORTFOLIO_KEY = "PORTFOLIO";

const MISSING_REASONS: Record<string, string> = {
  missing_in_closing: "No price data",
  missing_in_screener: "No screener data",
  missing_in_both: "No price or screener data",
};

const seriesName = (key: string) =>
  key === PORTFOLIO_KEY
    ? "This Strategy"
    : key === "NIFTY500"
      ? "NIFTY 500"
      : key.replace(/_/g, " ");

const sizeName = (name: string) => (/cap/i.test(name) ? name : `${name} Cap`);

/** Keep a long daily series light enough for a small chart. */
function downsample<T>(rows: T[], max = 160): T[] {
  if (rows.length <= max) return rows;
  const step = (rows.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => rows[Math.round(i * step)]);
}

const monthLabel = (v: unknown) => {
  const d = new Date(
    typeof v === "string" && /^\d+$/.test(v)
      ? Number(v)
      : (v as string | number),
  );
  if (Number.isNaN(d.getTime())) return String(v ?? "");
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
};

/** Real detail for an advisor strategy, from `GET /api/strategies/{id}`. */
export function advisorDetailModel(
  s: StrategyAnalyticsResponse,
): StrategyDetailModel {
  const a = s.analytics;
  const stats = a.stats;
  const stat = (m: PortfolioMetric, key = PORTFOLIO_KEY) =>
    toNumber(getStatValue(stats, m, key));
  const isLongShort = a.portfolio_type === "long_short";
  const missing = a.missing_holdings ?? [];
  const allMissing = missing.length > 0 && missing.length === a.holdings.length;

  // The benchmark is whichever column the stats carry besides the portfolio.
  const benchKey = Object.keys(stats?.[0] ?? {}).find(
    (k) => k !== "Stats" && k !== PORTFOLIO_KEY,
  );

  const metric = (label: string, value: string | null): DetailRow | null =>
    value === null || value === "--" ? null : { label, value };

  const keyMetrics = [
    metric("1Y Returns", formatPct(stat(PortfolioMetric.Return1Y))),
    metric("3Y Returns", formatPct(stat(PortfolioMetric.Return3Y))),
    metric("CAGR", formatPct(stat(PortfolioMetric.CAGR))),
    metric(
      "Volatility",
      formatPct(stat(PortfolioMetric.Volatility), { signed: false }),
    ),
    metric("Sharpe Ratio", formatRatio(stat(PortfolioMetric.SharpeRatio))),
    metric("Sortino Ratio", formatRatio(stat(PortfolioMetric.SortinoRatio))),
    metric("Max Drawdown", formatPct(stat(PortfolioMetric.MaxDrawdown))),
    metric("Calmar Ratio", formatRatio(stat(PortfolioMetric.CalmarRatio))),
    ...(isLongShort
      ? [
          metric("Net Exposure", formatPct(a.net_exposure, { signed: false })),
          metric(
            "Gross Exposure",
            formatPct(a.gross_exposure, { signed: false }),
          ),
        ]
      : []),
  ].filter((r): r is DetailRow => r !== null);

  const byWeight = (x: AllocationItem, y: AllocationItem) =>
    Math.abs(y.pct) - Math.abs(x.pct);

  const holdings = [...a.holdings]
    .sort(
      (x, y) =>
        Math.abs(Number(y.weight ?? 0)) - Math.abs(Number(x.weight ?? 0)),
    )
    .map((h, i) => {
      const weight = Number(h.weight ?? 0);
      const mcap = toNumber(h.T3M_Avg_Mcap);
      return {
        key: `${String(h.Ticker ?? "")}-${i}`,
        name: String(h.Ticker ?? "—"),
        sub: h.Company_Name ? String(h.Company_Name) : undefined,
        cells: [
          {
            text: `${weight.toFixed(2)}%`,
            tone: weight < 0 ? ("down" as const) : undefined,
          },
          { text: h.Size ? String(h.Size) : "—" },
          { text: mcap === null ? "—" : `₹${(mcap / 1000).toFixed(1)}K Cr` },
        ] as StrategyDetailModel["holdings"]["rows"][number]["cells"],
      };
    });

  // Returns chart: one line per column the backend coloured.
  const chart = a.returns_chart_data;
  const keys = Object.keys(chart?.colors ?? {}).length
    ? Object.keys(chart.colors)
    : Object.keys(chart?.data?.[0] ?? {}).filter((k) => k !== "date");
  const ordered = [...keys].sort(
    (x, y) => Number(y === PORTFOLIO_KEY) - Number(x === PORTFOLIO_KEY),
  );
  const series: ChartSeries[] = ordered.map((key, i) => ({
    key,
    name: seriesName(key),
    color: SERIES_COLORS[Math.min(i, 2)],
    dashed: i >= 2,
    width: i >= 2 ? 1.5 : 2,
  }));
  const perfData = downsample(chart?.data ?? []).map((p) => {
    const row: Record<string, number | string> = { date: monthLabel(p.date) };
    for (const k of keys) {
      const n = toNumber(p[k]);
      if (n !== null) row[k] = n;
    }
    return row;
  });

  // Strategy vs benchmark on the return windows both sides report.
  const benchRows = benchKey
    ? (
        [
          ["1Y", PortfolioMetric.Return1Y],
          ["3Y", PortfolioMetric.Return3Y],
          ["CAGR", PortfolioMetric.CAGR],
        ] as const
      )
        .map(([name, m]) => ({
          name,
          basket: stat(m),
          bench: stat(m, benchKey),
        }))
        .filter((r) => r.basket !== null && r.bench !== null)
        .map((r) => ({
          name: r.name,
          basket: r.basket as number,
          bench: r.bench as number,
        }))
    : [];

  const firstScore = (items: { value: number }[] | undefined) =>
    toNumber(items?.[0]?.value);
  const overall = firstScore(a.overall_score_chart_data);
  const riskScore = firstScore(a.risk_score_chart_data);

  const ddDuration = getStatValue(stats, PortfolioMetric.MaxDrawdownDuration);
  const riskRows = [
    metric("Risk Level", s.risk_level || null),
    metric(
      "Volatility",
      formatPct(stat(PortfolioMetric.Volatility), { signed: false }),
    ),
    metric("VaR 95%", formatPct(stat(PortfolioMetric.VaR95))),
    metric("CVaR 95%", formatPct(stat(PortfolioMetric.CVaR95))),
    metric(
      "Max Drawdown Duration",
      ddDuration === null || ddDuration === undefined
        ? null
        : typeof ddDuration === "number"
          ? `${Math.round(ddDuration)} days`
          : String(ddDuration),
    ),
    metric(
      "Information Ratio",
      formatRatio(stat(PortfolioMetric.InformationRatio)),
    ),
  ].filter((r): r is DetailRow => r !== null);

  const holdingsCount = String(a.total_stocks ?? a.holdings.length);

  return {
    id: s.strategy,
    title: s.display_name,
    eyebrow: s.category || "Strategy",
    bannerTitle:
      s.description ||
      `A ${s.risk_level || "balanced"}-risk basket of ${holdingsCount} holdings`,
    tags: [
      s.category,
      ...(s.keywords ?? "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    ]
      .filter(
        (t, i, all) =>
          t && all.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i,
      )
      .slice(0, 5),
    risk: s.risk_level || undefined,
    stats: isLongShort
      ? [
          {
            label: "Sharpe Ratio",
            value: formatRatio(stat(PortfolioMetric.SharpeRatio)),
            accent: true,
          },
          { label: "Holdings", value: holdingsCount },
          {
            label: "Max Drawdown",
            value: formatPct(stat(PortfolioMetric.MaxDrawdown)),
          },
        ]
      : [
          {
            label: "1Y Returns",
            value: formatPct(stat(PortfolioMetric.Return1Y)),
            accent: true,
          },
          { label: "Holdings", value: holdingsCount },
          { label: "Min Invest", value: ADVISOR_MIN_INVESTMENT },
        ],
    tabs: allMissing
      ? ["holdings"]
      : ["overview", "holdings", "performance", "analytics"],
    overview: {
      keyMetrics,
      sectorLabel: "Industry Allocation",
      sectorAllocation: a.industry_distribution
        .map((d) => ({ name: d.name, pct: d.value }))
        .sort(byWeight),
      marketCapAllocation: a.size_distribution
        .map((d) => ({ name: sizeName(d.name), pct: d.value }))
        .sort(byWeight),
      signed: isLongShort,
      excluded: allMissing
        ? undefined
        : missing.map((m) => ({
            ticker: m.Ticker,
            weight: `${m.weight.toFixed(2)}%`,
            reason: MISSING_REASONS[m.reason] ?? m.reason,
          })),
    },
    holdings: { columns: ["Weight", "Size", "Mkt Cap"], rows: holdings },
    performance: {
      label:
        series.length > 1
          ? series.map((x) => x.name).join(" vs ")
          : "Cumulative Returns",
      caption: chart?.description,
      unit: "%",
      xKey: "date",
      data: perfData,
      series,
    },
    analytics: {
      benchmark: benchRows.length
        ? {
            data: benchRows,
            series: [
              { key: "basket", name: "This Strategy", color: SERIES_COLORS[0] },
              {
                key: "bench",
                name: seriesName(benchKey as string),
                color: SERIES_COLORS[1],
              },
            ],
          }
        : null,
      scores: [
        ...(overall === null
          ? []
          : [{ label: "Overall Score", value: overall, higherIsBetter: true }]),
        ...(riskScore === null
          ? []
          : [{ label: "Risk Score", value: riskScore, higherIsBetter: false }]),
      ],
      risk: riskRows,
    },
  };
}

/** Illustrative detail for a static basket (no analytics backend yet). */
export function basketDetailModel(s: IdeaStrategy): StrategyDetailModel {
  const holdingsCount = s.stocks ?? 20;
  const return1Y = s.return1Y ?? s.launchStatus ?? "+24.0%";
  return {
    id: s.id,
    title: s.title,
    eyebrow: s.tags[0] ?? "Strategy",
    bannerTitle:
      s.description ||
      `A ${s.risk ?? "balanced"}-risk basket of ${holdingsCount} curated holdings, rebalanced quarterly`,
    tags: s.tags,
    risk: s.risk,
    stats: [
      { label: "1Y Returns", value: return1Y, accent: !!s.return1Y },
      { label: "Holdings", value: String(holdingsCount) },
      { label: "Min Invest", value: PLACEHOLDER_MIN_INVESTMENT },
    ],
    tabs: ["overview", "holdings", "performance", "analytics"],
    overview: {
      keyMetrics: [
        { label: "1Y Returns", value: return1Y },
        ...placeholderKeyMetrics,
      ],
      sectorLabel: "Sector Allocation",
      sectorAllocation: placeholderSectorAllocation,
      marketCapAllocation: placeholderMarketCapAllocation,
    },
    holdings: {
      columns: ["Weight", "Price", "Chg"],
      rows: placeholderHoldings.map((h) => ({
        key: h.name,
        name: h.name,
        cells: [
          { text: `${h.weight}%` },
          { text: `₹${h.price.toLocaleString("en-IN")}` },
          {
            text: `${Math.abs(h.change)}%`,
            tone: h.change >= 0 ? "up" : "down",
            arrow: true,
          },
        ],
      })),
    },
    performance: {
      label: "This Basket vs Nifty 50 vs Industry Avg",
      xKey: "m",
      data: placeholderPerformance,
      series: [
        {
          key: "basket",
          name: "This Basket",
          color: SERIES_COLORS[0],
          width: 2,
        },
        { key: "nifty", name: "Nifty 50", color: SERIES_COLORS[1], width: 2 },
        {
          key: "industry",
          name: "Industry Avg",
          color: SERIES_COLORS[2],
          width: 1.5,
          dashed: true,
        },
      ],
    },
    analytics: {
      benchmark: {
        data: placeholderBenchmark,
        series: [
          { key: "basket", name: "This Basket", color: SERIES_COLORS[0] },
          { key: "nifty", name: "Nifty 50", color: SERIES_COLORS[1] },
        ],
      },
      scores: [],
      risk: [
        { label: "Risk Level", value: s.risk ?? "Medium" },
        ...placeholderRisk,
      ],
    },
  };
}
