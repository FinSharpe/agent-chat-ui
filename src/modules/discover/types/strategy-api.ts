/**
 * The strategies API fields the generated client predates, typed here —
 * mirrors finsharpe-mobile's `features/discover/data/strategy_api.dart`
 * (ADR-0010). Change the two together.
 *
 * Both responses also carry trailing-return figures — `stats`/`spark` on the
 * list, `returns_chart_data` and the ~30-row `stats` table on the detail.
 * Every one of them prices the strategy's *current* holdings backwards across
 * the whole window, ignoring the rebalance history, so they describe a basket
 * that never existed: look-ahead and survivorship bias (finsharpe-agents#92).
 * None of them are typed here, so none can render by accident. The only
 * return figure shown is the day move — one session, over which "the current
 * holdings" is unconditionally true.
 */
import type {
  StrategyAnalyticsResponse,
  StrategyMasterDetail,
} from "@/api/generated/strategy-apis/models";
import type {
  DayMove,
  Snapshot,
} from "@/modules/import-data/types/holdings-analysis";

/** One row of `GET /api/strategies`, with the summary extension. */
export type StrategyListRow = StrategyMasterDetail & {
  type?: string | null;
  rebalance_frequency?: string | null;
  as_of_date?: string | null;
  day_move?: DayMove | null;
};

/** One rebalance on record, read straight off the dated holdings history. */
export type RebalanceEvent = {
  as_of_date: string;
  holdings: number;
  /** Null on the first rebalance on record — nothing to compare to. */
  added?: number | null;
  removed?: number | null;
  /** One-way turnover vs the previous rebalance (½·Σ|Δw|). */
  turnover_pct?: number | null;
};

export type StrategySnapshot = Snapshot & {
  rebalance_history?: RebalanceEvent[];
};

/** `GET /api/strategies/{name}` with its point-in-time `snapshot`. */
export type StrategyDetailResponse = StrategyAnalyticsResponse & {
  snapshot?: StrategySnapshot | null;
};

/**
 * One row of `GET /api/strategies/{name}/holdings` — the raw dated rebalance
 * record. Scale trap: `weight` here is a 0–1 fraction, unlike the detail's
 * holdings, which are already percent.
 */
export type DatedHolding = {
  as_of_date: string;
  asset_type?: string | null;
  symbol: string;
  isin?: string | null;
  weight: number;
};

/** ETF tickers arrive with no company name from the screener. */
export const ETF_NAME_FALLBACK: Record<string, string> = {
  SETFNIF50: "SBI Nifty 50 ETF",
  EBBETF0430: "Bharat Bond ETF April 2030",
  GOLDBEES: "Nippon India Gold BeES ETF",
  MON100: "Motilal Oswal Nasdaq 100 ETF",
};
