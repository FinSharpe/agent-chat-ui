import type {
  AnalysedHolding,
  Distribution,
} from "@/modules/import-data/types/holdings-analysis";
import type { StrategySnapshot } from "./strategy-api";

/**
 * Discover feature types — the landing's feature ids, the Explore Investment
 * Ideas catalog, and the view model the strategy detail renders from.
 */

/**
 * A Discover sub-feature that can actually be entered. `workflows` and
 * `builder` are separate routes; the rest render inside the Discover screen.
 *
 * Explore Trading Ideas and Global Investing are deliberately absent: their
 * screens were invented content and have been deleted (T-04), so they are
 * coming-soon rows with no route rather than features with a broken one.
 */
export type DiscoverFeature =
  | "news"
  | "ideas"
  | "ipos"
  | "workflows"
  | "builder";

export const DISCOVER_FEATURES: readonly DiscoverFeature[] = [
  "news",
  "ideas",
  "ipos",
  "workflows",
  "builder",
];

/** Features rendered inside the Discover screen (the rest are routes). */
export type LocalDiscoverFeature = Exclude<
  DiscoverFeature,
  "workflows" | "builder"
>;

export type RiskLevel = "Low" | "Medium" | "High" | "Very High";

/**
 * One strategy row in Explore Investment Ideas. Every row on screen comes
 * from the strategies API — there is no static catalog any more.
 */
export interface IdeaStrategy {
  /** The API strategy id. */
  id: string;
  title: string;
  /** Short line under the title in the list (a tag, sub-theme or style). */
  summary?: string;
  /** Longer description — the detail banner's headline. */
  description?: string;
  tags: string[];
  /**
   * The book's latest one-session move, in percent. Deliberately the only
   * return figure on the row: every trailing figure the list serves is a
   * back-test of today's holdings (finsharpe-agents#92).
   */
  dayPct?: number;
  risk?: string;
  stocks?: number;
  /** "concentrated" — the detail's tag row (the detail response lacks it). */
  type?: string;
  /** The policy field, which the published record does not always keep to. */
  rebalanceFrequency?: string;
  /** Date of the current published portfolio (ISO). */
  asOfDate?: string;
}

export interface IdeaCategory {
  id: string;
  name: string;
  strategies: IdeaStrategy[];
  /** The advisor category is fetched; the others are static. */
  isLoading?: boolean;
  isError?: boolean;
  /**
   * Nothing backs this category, so its card cannot be opened and carries a
   * "Coming soon" chip in place of a strategy count.
   */
  disabled?: boolean;
}

/* ---------- strategy detail view model ---------- */

export interface DetailStat {
  label: string;
  value: string;
  /** Small line under the value ("NIFTY 500 -0.29%", "since 16 Oct"). */
  sub?: string;
  /** Tint the value green/rose by its sign. */
  signed?: boolean;
}

export interface ExcludedHolding {
  ticker: string;
  weight: string;
  reason: string;
}

export type DetailTabId = "overview" | "holdings" | "quality" | "rebalances";

/**
 * Everything the strategy detail shows, after finsharpe-mobile's
 * `StrategyDetailScreen`: the composition and the point-in-time `snapshot`,
 * all exact as of the stated dates. Nothing here is a trailing return.
 */
export interface StrategyDetailModel {
  id: string;
  title: string;
  eyebrow: string;
  bannerTitle: string;
  tags: string[];
  risk?: string;
  /** "Stated cadence monthly · portfolio as of 5 May 2026". */
  meta?: string;
  stats: [DetailStat, DetailStat, DetailStat, DetailStat];
  /** Tabs with nothing behind them are dropped rather than shown empty. */
  tabs: DetailTabId[];
  snapshot: StrategySnapshot;
  industry: Distribution[];
  size: Distribution[];
  holdings: AnalysedHolding[];
  excluded: ExcludedHolding[];
}
