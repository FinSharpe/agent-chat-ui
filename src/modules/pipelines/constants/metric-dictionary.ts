/**
 * The metric dictionary: display labels, units and sign rules for the raw
 * snake_case metric keys the frozen report carries.
 *
 * The wire deliberately ships bare numbers (`excess_return_1y_pct: 9.3`) with
 * no presentation strings, so every client supplies both — which couples this
 * table to `pipeline_version` 1 of each Pipeline that emits a key (a contract
 * fact recorded in the Phase 6 sign-off; `finsharpe-mobile`'s
 * `metric_dictionary.dart` and the server's `METRIC_LABELS` are the other two
 * copies). A key this table does not know falls back to a humanised label and
 * a plain number, never a crash.
 */

export type MetricTone =
  /** Colour by the value's sign (returns, growth, drawdown). */
  | "signed"
  /** Colour a true/false answer (above the DMA). */
  | "boolean"
  /** Always neutral ink. */
  | "plain";

interface MetricDisplay {
  label: string;
  format: (value: MetricValue) => string;
  tone?: MetricTone;
}

export type MetricValue = boolean | number | string | null;

/**
 * Indian-market digit grouping (12,34,567).
 *
 * Exported for the report Table, which reads no *dictionary* — every column
 * declares its own unit — but must group its digits the same way, or one
 * frozen document would show two number formats on one page.
 */
export function group(value: number): string {
  const s = Math.abs(value).toString();
  const sign = value < 0 ? "-" : "";
  if (s.length <= 3) return sign + s;
  const head = s.slice(0, -3);
  const tail = s.slice(-3);
  const parts: string[] = [];
  let rest = head;
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  parts.unshift(rest);
  return `${sign}${parts.join(",")},${tail}`;
}

function num(value: MetricValue, decimals = 1): string {
  if (typeof value !== "number") return String(value);
  if (Number.isInteger(value) && decimals <= 1) return group(value);
  return value.toFixed(decimals);
}

const inr = (v: MetricValue) =>
  typeof v === "number" ? `₹${group(Math.round(v))}` : String(v);

const crores = (v: MetricValue) =>
  typeof v === "number" ? `₹${group(Math.round(v))} cr` : String(v);

const pct = (v: MetricValue) =>
  typeof v === "number" ? `${num(v)}%` : String(v);

const signedPct = (v: MetricValue) =>
  typeof v === "number"
    ? `${v >= 0 ? "+" : "−"}${num(Math.abs(v))}%`
    : String(v);

const signedPp = (v: MetricValue) =>
  typeof v === "number"
    ? `${v >= 0 ? "+" : "−"}${num(Math.abs(v))}pp`
    : String(v);

const mult = (v: MetricValue) =>
  typeof v === "number" ? `${num(v)}×` : String(v);

const yesNo = (v: MetricValue) => (v === true ? "Yes" : "No");

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatWireDate(value: unknown): string {
  const raw = String(value ?? "");
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const date = (v: MetricValue) => formatWireDate(v);

const METRIC_DICTIONARY: Record<string, MetricDisplay> = {
  // price_action
  last_close: { label: "Close", format: inr },
  return_1y_pct: { label: "1Y return", format: signedPct, tone: "signed" },
  benchmark_return_1y_pct: {
    label: "Benchmark, 1Y",
    format: signedPct,
    tone: "signed",
  },
  excess_return_1y_pct: { label: "Excess", format: signedPp, tone: "signed" },
  high_52w: { label: "52w high", format: inr },
  low_52w: { label: "52w low", format: inr },
  drawdown_from_high_pct: {
    label: "From 52-week high",
    format: signedPct,
    tone: "signed",
  },
  // trend
  dma_50: { label: "50-day avg", format: inr },
  dma_200: { label: "200-day avg", format: inr },
  above_dma_50: { label: "Above 50-day", format: yesNo, tone: "boolean" },
  above_dma_200: { label: "Above 200-day", format: yesNo, tone: "boolean" },
  rsi_14: { label: "RSI (14)", format: (v) => num(v) },
  // scores
  finsharpe_score: { label: "Composite", format: (v) => num(v) },
  momentum_score: { label: "Momentum", format: (v) => num(v) },
  quality_score: { label: "Quality", format: (v) => num(v) },
  valuation_score: { label: "Valuation", format: (v) => num(v) },
  volatility_score: { label: "Volatility", format: (v) => num(v) },
  // fundamentals
  pe: { label: "P/E", format: mult },
  pb: { label: "P/B", format: mult },
  roe_pct: { label: "ROE", format: pct, tone: "signed" },
  roce_pct: { label: "ROCE", format: pct, tone: "signed" },
  debt_to_equity: { label: "Debt / equity", format: (v) => num(v) },
  market_cap_cr: { label: "Market cap", format: crores },
  revenue_growth_yoy_pct: {
    label: "Revenue growth",
    format: signedPct,
    tone: "signed",
  },
  eps_growth_yoy_pct: {
    label: "EPS growth",
    format: signedPct,
    tone: "signed",
  },
  // risk
  annual_volatility_pct: { label: "Volatility", format: pct },
  benchmark_volatility_pct: { label: "Benchmark vol.", format: pct },
  volatility_vs_benchmark: { label: "Vol. vs benchmark", format: mult },
  max_drawdown_pct: {
    label: "Max drawdown",
    format: signedPct,
    tone: "signed",
  },
  sharpe_ratio: { label: "Sharpe", format: (v) => num(v) },
  annual_return_pct: { label: "1Y return", format: signedPct, tone: "signed" },
  benchmark_return_pct: {
    label: "Benchmark, 1Y",
    format: signedPct,
    tone: "signed",
  },
  // filings
  chunk_count: { label: "Passages read", format: (v) => num(v) },
  latest_filing_date: { label: "Latest filing", format: date },
  days_since_latest_filing: {
    label: "Days since filing",
    format: (v) => num(v),
  },
  categories: { label: "Document types", format: (v) => String(v) },
  // news
  article_count: { label: "Articles", format: (v) => num(v) },
  active_days: { label: "Active sessions", format: (v) => num(v) },
  latest_article_date: { label: "Most recent", format: date },
  // positioning
  put_call_ratio: { label: "Put-call ratio", format: (v) => num(v) },
  expiry: { label: "Expiry", format: date },
  max_call_oi_strike: { label: "Peak call OI", format: inr },
  max_put_oi_strike: { label: "Peak put OI", format: inr },
  strike_count: { label: "Strikes", format: (v) => num(v) },
  // top_down_research / sector_momentum
  sectors_ranked: { label: "Sectors ranked", format: (v) => num(v) },
  sectors_sourcing: {
    label: "Can source candidates",
    format: (v) => num(v),
  },
  sectors_advanced: { label: "Sectors advanced", format: (v) => num(v) },
  top_sector: { label: "Strongest sector", format: (v) => String(v) },
  top_sector_score: { label: "Top composite score", format: (v) => num(v) },
  top_sector_return_3m_pct: {
    label: "Strongest, 3M",
    format: signedPct,
    tone: "signed",
  },
  benchmark_return_3m_pct: {
    label: "Nifty 50, 3M",
    format: signedPct,
    tone: "signed",
  },
};

/** One metric, ready for a stat tile. */
export interface MetricTile {
  key: string;
  label: string;
  value: string;
  /** >0 positive, <0 negative, null neutral. */
  toneSign: number | null;
}

function humanise(key: string): string {
  const words = key.split("_").filter(Boolean);
  if (!words.length) return key;
  const joined = words.join(" ");
  return joined[0].toUpperCase() + joined.slice(1);
}

/**
 * Present a raw metrics map in wire order. Nulls and unknown non-scalar values
 * are dropped; unknown scalar keys fall back to a humanised label.
 */
export function presentMetrics(
  metrics: Record<string, unknown> | undefined,
): MetricTile[] {
  if (!metrics) return [];
  const tiles: MetricTile[] = [];
  for (const [key, raw] of Object.entries(metrics)) {
    if (raw === null || raw === undefined) continue;
    const display = METRIC_DICTIONARY[key];
    if (!display) {
      if (Array.isArray(raw)) {
        tiles.push({
          key,
          label: humanise(key),
          value: raw.map(String).join(" · "),
          toneSign: null,
        });
        continue;
      }
      if (typeof raw === "object") continue;
      tiles.push({
        key,
        label: humanise(key),
        value: String(raw),
        toneSign: null,
      });
      continue;
    }
    if (Array.isArray(raw)) {
      tiles.push({
        key,
        label: display.label,
        value: raw.map(String).join(" · "),
        toneSign: null,
      });
      continue;
    }
    if (typeof raw === "object") continue;
    const value = raw as MetricValue;
    const toneSign =
      display.tone === "signed" && typeof value === "number"
        ? value
        : display.tone === "boolean"
          ? value === true
            ? 1
            : -1
          : null;
    tiles.push({
      key,
      label: display.label,
      value: display.format(value),
      toneSign,
    });
  }
  return tiles;
}
