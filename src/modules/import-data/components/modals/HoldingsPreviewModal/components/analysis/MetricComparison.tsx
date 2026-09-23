"use client";
import type { ComparisonMetric } from "@/modules/import-data/types/holdings-analysis";
import { DataPanel } from "@/modules/import-data/components/shared/ui";
import { coverageLabel, metricValue } from "./format";

const PORTFOLIO_BAR = "bg-[#063BAA] dark:bg-[#8FB4FF]";
const PEER_BAR = "bg-slate-300 dark:bg-slate-600";

/** The equity fundamentals, grouped so a multiple reads apart from a growth rate. */
const EQUITY_GROUPS: [string, string[]][] = [
  ["Valuation", ["pe", "pb", "dividend_yield"]],
  ["Profitability", ["roe", "roce", "margin"]],
  ["Growth", ["sales_growth", "earnings_growth"]],
  ["Balance sheet", ["debt_equity", "current_ratio"]],
];

function groupMetrics(metrics: ComparisonMetric[]) {
  const byKey = new Map(metrics.map((m) => [m.key, m]));
  const groups: [string, ComparisonMetric[]][] = [];
  for (const [title, keys] of EQUITY_GROUPS) {
    const found = keys.flatMap((k) => {
      const m = byKey.get(k);
      byKey.delete(k);
      return m ? [m] : [];
    });
    if (found.length) groups.push([title, found]);
  }
  if (byKey.size) groups.push(["Other", [...byKey.values()]]);
  return groups;
}

/** One bar on an axis shared by both sides, anchored at zero. */
function AxisBar({
  value,
  lo,
  hi,
  className,
}: {
  value: number;
  lo: number;
  hi: number;
  className: string;
}) {
  const span = hi - lo || 1;
  const zero = ((0 - lo) / span) * 100;
  const end = ((value - lo) / span) * 100;
  return (
    <div className="relative h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
      <span
        className={`absolute inset-y-0 rounded-full ${className}`}
        style={{
          left: `${Math.min(zero, end)}%`,
          width: `max(${Math.abs(end - zero)}%, 2px)`,
        }}
      />
    </div>
  );
}

function MetricRow({
  m,
  showPeer,
}: {
  m: ComparisonMetric;
  showPeer: boolean;
}) {
  const p = m.portfolio ?? null;
  const i = showPeer ? (m.industry ?? null) : null;
  const vals = [0, p ?? 0, i ?? 0];
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  return (
    <div className="space-y-1 py-2.5 text-[10.5px]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-forest-deep truncate dark:text-white">
          {m.label}
        </span>
        <span className="shrink-0 tabular-nums">
          <span className="text-forest-deep font-medium dark:text-white">
            {metricValue(p, m.unit)}
          </span>
          {i !== null && (
            <span className="ml-1.5 text-slate-400">
              vs {metricValue(i, m.unit)}
            </span>
          )}
        </span>
      </div>
      {p !== null && (
        <AxisBar
          value={p}
          lo={lo}
          hi={hi}
          className={PORTFOLIO_BAR}
        />
      )}
      {i !== null && (
        <AxisBar
          value={i}
          lo={lo}
          hi={hi}
          className={PEER_BAR}
        />
      )}
      {m.coverage_pct < 99.5 && (
        <p className="text-[9.5px] text-slate-400">
          Covers {coverageLabel(m.coverage_pct)}% of value
        </p>
      )}
    </div>
  );
}

/** Metrics as a portfolio bar over its peer-average bar; drops the peer
 *  dimension entirely when no row carries one (the ETF track record). */
export function MetricComparisonCard({
  title,
  metrics,
  peerNoun,
  note,
}: {
  title: string;
  metrics: ComparisonMetric[];
  peerNoun: string;
  note?: string;
}) {
  if (metrics.length === 0) return null;
  const showPeer = metrics.some((m) => m.industry != null);
  return (
    <DataPanel
      title={title}
      addon={
        showPeer ? (
          <span className="flex items-center gap-2 normal-case">
            <span className="flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${PORTFOLIO_BAR}`} />
              Yours
            </span>
            <span className="flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${PEER_BAR}`} />
              {peerNoun} avg
            </span>
          </span>
        ) : undefined
      }
    >
      <div className="divide-border-subtle -my-2.5 divide-y">
        {metrics.map((m) => (
          <MetricRow
            key={m.key}
            m={m}
            showPeer={showPeer}
          />
        ))}
      </div>
      {note && (
        <p className="border-border-subtle mt-3 border-t pt-2 text-[10px] leading-relaxed text-slate-400">
          {note}
        </p>
      )}
    </DataPanel>
  );
}

/** Equity quality: the weighted fundamentals, one card per group. */
export function EquityFundamentals({
  metrics,
}: {
  metrics: ComparisonMetric[];
}) {
  const groups = groupMetrics(metrics);
  return (
    <>
      {groups.map(([title, list], idx) => (
        <MetricComparisonCard
          key={title}
          title={title}
          metrics={list}
          peerNoun="Industry"
          note={
            idx === groups.length - 1
              ? "Weighted across the current holdings, against the same weighted blend of their industries. P/E and P/B are harmonic means — the portfolio's actual multiple — and exclude loss-making holdings, which have none."
              : undefined
          }
        />
      ))}
    </>
  );
}
