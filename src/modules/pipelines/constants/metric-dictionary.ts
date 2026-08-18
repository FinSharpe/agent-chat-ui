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
  // top_down_research / fundamental_analysis
  //
  // The `fundamentals_` prefix is load bearing rather than tidy: this Section
  // counts and summarises fifteen names, while Deep Dive's Fundamentals
  // Section publishes `roce_pct`, `pe` and the rest as figures about the one
  // stock a reader bought a report on. A key means the same thing in every
  // report or it gets a different name.
  fundamentals_shortlisted: {
    label: "Shortlisted names",
    format: (v) => num(v),
  },
  fundamentals_resolved: {
    label: "Peer reads resolved",
    format: (v) => num(v),
  },
  fundamentals_missed: { label: "Not resolved", format: (v) => num(v) },
  fundamentals_ranked: { label: "Ranked on all seven", format: (v) => num(v) },
  fundamentals_consolidated_basis: {
    label: "Consolidated accounts",
    format: (v) => num(v),
  },
  fundamentals_standalone_basis: {
    label: "Standalone fallback",
    format: (v) => num(v),
  },
  fundamentals_median_peer_count: {
    label: "Median peer set",
    format: (v) => num(v),
  },
  // A ratio rather than a valuation multiple, but it takes the multiple's
  // formatter because both read as "so many times".
  fundamentals_median_cash_conversion: {
    label: "Median CFO / PBT",
    format: mult,
  },
  // Percentage points, not percent: this is the difference between two
  // percentages, and a percent sign would invite a reader to take a 1.6pp
  // edge over the peer median for a 1.6% return.
  fundamentals_median_roce_vs_peer_pp: {
    label: "Median ROCE vs peer",
    format: signedPp,
    tone: "signed",
  },
  fundamentals_median_cash_flow_years: {
    label: "Median years of cash flow",
    format: (v) => num(v),
  },
  fundamentals_strongest: {
    label: "Strongest on rank",
    format: (v) => String(v),
  },
  // top_down_research / technical_analysis
  //
  // The `technicals_` prefix carries the load the `fundamentals_` one above
  // does, against a closer neighbour: Deep Dive's Trend Section publishes
  // `rsi_14`, `dma_50`, `dma_200` and `above_dma_200` as one stock's readings,
  // off the same arithmetic. These are counts and medians across fifteen
  // names, which is not that fact.
  technicals_shortlisted: { label: "Shortlisted names", format: (v) => num(v) },
  technicals_resolved: { label: "Price history read", format: (v) => num(v) },
  technicals_missed: { label: "Not resolved", format: (v) => num(v) },
  technicals_ranked: { label: "Ranked on all three", format: (v) => num(v) },
  technicals_gate_passed: {
    label: "Passed the trend gate",
    format: (v) => num(v),
  },
  // A tile rather than a footnote, because a relaxed gate changes what the
  // ranking beside it means: the names under it were not all in uptrends.
  technicals_gate_relaxed: {
    label: "Trend gate relaxed",
    format: yesNo,
    tone: "boolean",
  },
  // Signed, and never positive: the last close sits inside the window its own
  // high is taken over, so a shortlist at its highs reads 0.0%.
  technicals_median_pct_from_52w_high: {
    label: "Median from 52w high",
    format: signedPct,
    tone: "signed",
  },
  // A ratio rather than a valuation multiple, taking the multiple's formatter
  // for the reason the cash conversion tile above does: both read as "so many
  // times", here of the fifty session average volume.
  technicals_median_volume_ratio: {
    label: "Median volume 10d / 50d",
    format: mult,
  },
  technicals_strongest: {
    label: "Strongest on technicals",
    format: (v) => String(v),
  },
  // top_down_research / stock_ideas
  //
  // Counts and two identities, and deliberately nothing that reads as a
  // return. This is the Section a reader arrives at for the answer, so a tile
  // carrying a percentage beside three symbols would be the forward claim the
  // whole Section is built to refuse.
  ideas_published: { label: "Stocks named", format: (v) => num(v) },
  ideas_shortlisted: { label: "Shortlisted names", format: (v) => num(v) },
  ideas_eligible: { label: "Carried both ranks", format: (v) => num(v) },
  ideas_ineligible: { label: "Could not be compared", format: (v) => num(v) },
  ideas_sectors_available: {
    label: "Sectors represented",
    format: (v) => num(v),
  },
  // A tile rather than a footnote, for the reason the relaxed gate above is
  // one: it says the one name per sector rule actually removed something from
  // this run, which is what makes the rule visible rather than stated.
  ideas_displaced: {
    label: "Displaced by the sector cap",
    format: (v) => num(v),
  },
  ideas_top_symbol: {
    label: "Highest combined rank",
    format: (v) => String(v),
  },
  // The rank average itself, where 1 is strongest. Two decimals rather than a
  // place: two names can share it, and it is a comparable figure rather than a
  // position.
  ideas_top_combined_rank: {
    label: "Its combined rank",
    format: (v) => num(v, 2),
  },
  // top_down_research / newsflow_filings
  //
  // Counts of what was read about three names, and one date. The `newsflow_`
  // prefix carries the same load the two above it do, against a much closer
  // neighbour: Deep Dive's own Filings and News Sections publish
  // `chunk_count`, `latest_filing_date` and `article_count` as figures about
  // the one stock a reader bought a report on. Nothing here is that fact -
  // these are totals across three names - so none of them may land on a key a
  // reader has already met as one company's reading.
  // "Selected names" rather than "names covered": `covered` is a coverage word
  // in this report and the tile beside this one is a coverage count, so
  // reusing it here would read as how many of the three filings reached.
  newsflow_picks: { label: "Selected names", format: (v) => num(v) },
  newsflow_picks_with_news: { label: "News tape read", format: (v) => num(v) },
  // "read" is load bearing twice over. It is not the macro Section's
  // "Headlines, 30 days" above, which is the feed's own match count over a
  // whole theme; and it is not the Table below it, which prints the most
  // recent eight per name. This is what the paragraph was grounded on.
  newsflow_headlines: {
    label: "Headlines read, 30 days",
    format: (v) => num(v),
  },
  // Both counts, and the gap between them is the finding: a name inside the
  // Nifty 50 that the store held no passage for is a different absence from a
  // name the store was never asked about.
  newsflow_in_filings_roster: {
    label: "In filings coverage",
    format: (v) => num(v),
  },
  newsflow_filings_covered: {
    label: "Filings drawn on",
    format: (v) => num(v),
  },
  newsflow_filings_documents: { label: "Filings read", format: (v) => num(v) },
  newsflow_filings_passages: { label: "Passages read", format: (v) => num(v) },
  // The newest filing any pick was read on. A date rather than an age in
  // days, because filings are not a declared vintage of this report and an age
  // would imply one clock over three companies that file on their own.
  newsflow_latest_filing_date: {
    label: "Newest filing drawn on",
    format: date,
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
