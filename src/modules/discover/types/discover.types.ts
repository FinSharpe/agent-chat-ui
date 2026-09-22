/**
 * Discover feature types — the landing's feature ids, the Explore Investment
 * Ideas catalog, and the view model the strategy detail renders from.
 */

/** A Discover sub-feature. `workflows` and `builder` are separate routes. */
export type DiscoverFeature =
  | "news"
  | "ideas"
  | "workflows"
  | "builder"
  | "trading"
  | "global";

export const DISCOVER_FEATURES: readonly DiscoverFeature[] = [
  "news",
  "ideas",
  "workflows",
  "builder",
  "trading",
  "global",
];

/** Features rendered inside the Discover screen (the rest are routes). */
export type LocalDiscoverFeature = Exclude<
  DiscoverFeature,
  "workflows" | "builder"
>;

export type RiskLevel = "Low" | "Medium" | "High" | "Very High";

/**
 * One strategy row in Explore Investment Ideas. Advisor strategies come from
 * the strategies API; every other category is the app's static catalog.
 */
export interface IdeaStrategy {
  /** Advisor: the API strategy id. Static baskets: a slug from the catalog. */
  id: string;
  source: "advisor" | "basket";
  title: string;
  /** Short line under the title in the list (a tag, sub-theme or style). */
  summary?: string;
  /** Longer description — the detail banner's headline. */
  description?: string;
  tags: string[];
  /** Signed 1Y return, formatted ("+26.3%"). */
  return1Y?: string;
  risk?: string;
  stocks?: number;
  /** Shown instead of a return (IPO Corner). */
  launchStatus?: string;
}

export interface IdeaCategory {
  id: string;
  name: string;
  strategies: IdeaStrategy[];
  /** The advisor category is fetched; the others are static. */
  isLoading?: boolean;
  isError?: boolean;
}

/* ---------- strategy detail view model ---------- */

export interface DetailStat {
  label: string;
  value: string;
  accent?: boolean;
}

export interface DetailRow {
  label: string;
  value: string;
}

export interface AllocationItem {
  name: string;
  /** Percent weight; negative for the short side of a long-short book. */
  pct: number;
}

export interface HoldingCell {
  text: string;
  tone?: "up" | "down";
  /** Show a trend arrow with the tone (a price change, not a weight). */
  arrow?: boolean;
}

export interface HoldingRow {
  key: string;
  name: string;
  sub?: string;
  cells: [HoldingCell, HoldingCell, HoldingCell];
}

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
  dashed?: boolean;
  width?: number;
}

export interface ExcludedHolding {
  ticker: string;
  weight: string;
  reason: string;
}

/**
 * Everything the strategy detail shows. Built from the strategies API for
 * advisor strategies, and from placeholder figures for static baskets, so one
 * view renders both.
 */
export interface StrategyDetailModel {
  id: string;
  title: string;
  eyebrow: string;
  bannerTitle: string;
  tags: string[];
  risk?: string;
  stats: [DetailStat, DetailStat, DetailStat];
  /** Tabs to show; an analysis with no priced holdings only has Holdings. */
  tabs: ("overview" | "holdings" | "performance" | "analytics")[];
  overview: {
    keyMetrics: DetailRow[];
    sectorLabel: string;
    sectorAllocation: AllocationItem[];
    marketCapAllocation: AllocationItem[];
    /** Long-short books show signed weights. */
    signed?: boolean;
    excluded?: ExcludedHolding[];
  };
  holdings: {
    columns: [string, string, string];
    rows: HoldingRow[];
  };
  performance: {
    label: string;
    caption?: string;
    /** Appended to values in the tooltip ("%" for cumulative returns). */
    unit?: string;
    xKey: string;
    data: Record<string, number | string>[];
    series: ChartSeries[];
  };
  analytics: {
    benchmark: {
      data: Record<string, number | string>[];
      series: ChartSeries[];
    } | null;
    /** 0–100 scores; `higherIsBetter` false for a risk score. */
    scores: { label: string; value: number; higherIsBetter: boolean }[];
    risk: DetailRow[];
  };
}
