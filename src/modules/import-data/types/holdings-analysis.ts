/**
 * The holdings-analysis view model the Import page's Equities / Mutual Funds /
 * ETF "Analyse" view renders, and the wire shapes it is read from.
 *
 * The three endpoints (`/api/portfolios/analyze`, `/api/mf-portfolios/analytics`,
 * `/api/etf-portfolios/analytics`) all serve a point-in-time `snapshot` of the
 * book (finsharpe-agents `schemas/api/snapshot.py`) that the generated client
 * types predate, so it is typed here. Mirrors finsharpe-mobile's
 * `ClassAnalytics` (lib/features/portfolio/data/analytics_api.dart).
 *
 * Deliberately absent: the cumulative-returns series and the trailing stats
 * table the equity and MF endpoints still serve. Both price today's quantities
 * backwards over a window the user did not hold them for (finsharpe-agents#92),
 * so neither is drawn.
 */

export type AnalysisKind = "equities" | "mutualFunds" | "etf";

export type Distribution = { name: string; value: number };

/** One session's move of the book as it stands today. */
export type DayMove = {
  as_of: string;
  prev_close_date: string;
  pct: number;
  bench_pct?: number | null;
  coverage_pct: number;
};

export type HoldingDayMove = {
  ticker: string;
  company_name?: string | null;
  weight_pct: number;
  day_pct: number;
  contribution_pct: number;
};

/** A weighted characteristic of the book beside its weight-matched peer blend. */
export type ComparisonMetric = {
  key: string;
  label: string;
  portfolio?: number | null;
  industry?: number | null;
  unit: "pct" | "x" | "score";
  higher_is_better?: boolean | null;
  aggregation?: "weighted_mean" | "weighted_harmonic_mean";
  coverage_pct: number;
};

export type Concentration = {
  holdings: number;
  max_weight_pct: number;
  top_5_weight_pct: number;
  top_10_weight_pct: number;
  hhi: number;
  effective_holdings: number;
};

export type Snapshot = {
  day_move?: DayMove | null;
  holding_moves?: HoldingDayMove[];
  score_profile?: ComparisonMetric[];
  fundamentals?: ComparisonMetric[];
  concentration?: Concentration | null;
};

/** The equity and MF cost block; the ETF one adds `coverage_pct`. */
export type CostAnalysis = {
  weighted_expense_ratio?: number | null;
  annual_cost?: number | null;
  monthly_cost?: number | null;
  /** The ETF endpoint's own book value; the MF endpoint's is a ₹1L reference
   *  base, so it is only ever read for ETFs. */
  portfolio_value?: number | null;
  coverage_pct?: number | null;
};

export type EtfTypeBreakdown = {
  items: Distribution[];
  disclosure_month?: string | null;
  coverage_pct: number;
};

export type EtfLookThroughHolding = {
  fincode?: number | null;
  name: string;
  sector: string;
  weight_pct: number;
  value: number;
  scheme_name: string;
  weight_in_scheme_pct: number;
  via_scheme_count: number;
};

export type EtfLookThrough = {
  sectors: Distribution[];
  top_holdings: EtfLookThroughHolding[];
  total_holdings: number;
  covered_value: number;
  disclosure_month?: string | null;
  coverage_pct: number;
};

export type EtfTrackRecord = {
  metrics: ComparisonMetric[];
  is_portfolio_return?: boolean;
};

/** A holding the endpoint could not (fully) include. */
export type MissingHolding = {
  id: string;
  name?: string | null;
  reason: string;
};

export type AnalysedHolding = {
  /** Ticker for equities, ISIN for funds and ETFs. */
  id: string;
  name: string;
  weight: number;
  /** FinSharpe (equity) / Performance (MF) score, 0–100, when screened. */
  score: number | null;
};

export type ClassAnalysis = {
  kind: AnalysisKind;
  snapshot: Snapshot;
  holdings: AnalysedHolding[];
  missing: MissingHolding[];
  /** Gauge fallbacks for a backend with no `score_profile`. */
  primaryScore: number | null;
  riskScore: number | null;
  industry: Distribution[];
  size: Distribution[];
  categories: Distribution[];
  cost: CostAnalysis | null;
  etf: {
    typeBreakdown: EtfTypeBreakdown | null;
    lookThrough: EtfLookThrough | null;
    trackRecord: EtfTrackRecord | null;
    /** What the analysed book is worth, per the endpoint's own prices. */
    bookValue: number | null;
    /** Every holding sent was excluded: nothing here describes the book. */
    nothingAnalysed: boolean;
  } | null;
};

/** What the FIP says the class cost, and the value of exactly those accounts. */
export type CostBasis = {
  cost: number;
  coveredValue: number;
  /** Share of the class the cost speaks for (0–100). */
  coveragePct: number;
};
