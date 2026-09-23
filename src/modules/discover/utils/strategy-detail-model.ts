import {
  DetailStat,
  DetailTabId,
  IdeaStrategy,
  StrategyDetailModel,
} from "../types/discover.types";
import {
  ETF_NAME_FALLBACK,
  StrategyDetailResponse,
} from "../types/strategy-api";
import { formatDayPct, shortDate } from "./format";

const MISSING_REASONS: Record<string, string> = {
  missing_in_closing: "No price data",
  missing_in_screener: "No screener data",
  missing_in_both: "No price or screener data",
};

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "medium" → "Moderate risk" where there is room for a label. */
export const riskLabel = (risk: string) =>
  ({ low: "Lower risk", medium: "Moderate risk", high: "Higher risk" })[
    risk.toLowerCase()
  ] ?? `${risk} risk`;

/** The four headline figures — mobile's `_SummaryStrip`. */
function summaryStats(s: StrategyDetailResponse): StrategyDetailModel["stats"] {
  const move = s.snapshot?.day_move;
  const holdings = s.analytics.total_stocks;
  const concentration = s.snapshot?.concentration;
  const history = s.snapshot?.rebalance_history ?? [];
  const turnover = history.at(-1)?.turnover_pct;

  const today: DetailStat = {
    label: "Today",
    value: move ? formatDayPct(move.pct) : "—",
    signed: !!move,
    // The close being described, never "today" unqualified: EOD prices land
    // after the bell and the backend caches for up to 12h.
    sub: !move
      ? "not priced"
      : move.bench_pct != null
        ? `NIFTY 500 ${formatDayPct(move.bench_pct)}`
        : `close ${shortDate(move.as_of)}`,
  };
  return [
    today,
    {
      label: "Holdings",
      value: holdings ? String(holdings) : "—",
      sub: concentration
        ? `top 5 hold ${concentration.top_5_weight_pct.toFixed(0)}%`
        : undefined,
    },
    // Counted off the published record, not the stated cadence: the policy
    // field can disagree with what was actually published.
    {
      label: "Rebalances",
      value: history.length ? String(history.length) : "—",
      sub: history.length
        ? `since ${shortDate(history[0].as_of_date)}`
        : "none on record",
    },
    {
      label: "Last turnover",
      value: turnover == null ? "—" : `${turnover.toFixed(0)}%`,
      sub:
        history.length < 2 ? "one rebalance on record" : "of the book replaced",
    },
  ];
}

/**
 * The detail for an advisor strategy, from `GET /api/strategies/{id}` —
 * finsharpe-mobile's `StrategyDetailScreen`. The list row supplies what the
 * detail response lacks (type, stated cadence, portfolio date).
 */
export function advisorDetailModel(
  s: StrategyDetailResponse,
  listItem?: IdeaStrategy,
): StrategyDetailModel {
  const a = s.analytics;
  const snapshot = s.snapshot ?? {};
  const missing = a.missing_holdings ?? [];

  const holdings = a.holdings.map((h) => {
    const ticker = String(h.Ticker ?? "");
    return {
      id: ticker,
      name: h.Company_Name
        ? String(h.Company_Name)
        : (ETF_NAME_FALLBACK[ticker] ?? ticker),
      weight: Number(h.weight ?? 0),
      score: null,
    };
  });

  const tabs: DetailTabId[] = [
    "overview",
    ...(holdings.length ? (["holdings"] as const) : []),
    ...(snapshot.fundamentals?.length ? (["quality"] as const) : []),
    ...(snapshot.rebalance_history?.length ? (["rebalances"] as const) : []),
  ];

  const meta = [
    // "Stated" on purpose: the policy field on the strategy row.
    listItem?.rebalanceFrequency &&
      `Stated cadence ${listItem.rebalanceFrequency}`,
    listItem?.asOfDate && `portfolio as of ${shortDate(listItem.asOfDate)}`,
  ].filter(Boolean);

  const risk = s.risk_level || undefined;
  return {
    id: s.strategy,
    title: s.display_name || s.strategy,
    eyebrow: s.category || "Strategy",
    bannerTitle:
      s.description ||
      `A ${risk ? riskLabel(risk).toLowerCase() : "balanced-risk"} basket of ${a.total_stocks} curated holdings${listItem?.rebalanceFrequency ? `, rebalanced ${listItem.rebalanceFrequency}` : ""}`,
    tags: [s.category, listItem?.type && capitalise(listItem.type)].filter(
      (t): t is string => !!t,
    ),
    risk,
    meta: meta.length ? meta.join(" · ") : undefined,
    stats: summaryStats(s),
    tabs,
    snapshot,
    industry: a.industry_distribution,
    size: a.size_distribution,
    holdings,
    excluded: missing.map((m) => ({
      ticker: m.Ticker,
      weight: `${m.weight.toFixed(2)}%`,
      reason: MISSING_REASONS[m.reason] ?? m.reason,
    })),
  };
}
