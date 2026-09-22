"use client";
import { PortfolioMetric } from "@/modules/core/portfolio/constants/portfolio-metrics";
import {
  DataPanel,
  formatPct,
} from "@/modules/import-data/components/shared/ui";
import { statNumber } from "./analysis-utils";

type Stats = Array<{ [key: string]: unknown }> | undefined;

// Stats worth a tile, in priority order; `pct` metrics read as percentages,
// the rest are ratios.
const METRICS: {
  metric: PortfolioMetric;
  label: string;
  desc: string;
  pct: boolean;
}[] = [
  {
    metric: PortfolioMetric.Return1Y,
    label: "1Y Return",
    desc: "Portfolio",
    pct: true,
  },
  {
    metric: PortfolioMetric.CAGR,
    label: "CAGR",
    desc: "Annualised",
    pct: true,
  },
  {
    metric: PortfolioMetric.Volatility,
    label: "Volatility",
    desc: "Annual",
    pct: true,
  },
  {
    metric: PortfolioMetric.SharpeRatio,
    label: "Sharpe",
    desc: "Risk-adjusted",
    pct: false,
  },
  {
    metric: PortfolioMetric.MaxDrawdown,
    label: "Max Drawdown",
    desc: "Worst fall",
    pct: true,
  },
  {
    metric: PortfolioMetric.SortinoRatio,
    label: "Sortino",
    desc: "Downside-adjusted",
    pct: false,
  },
];

/**
 * Portfolio statistics from the analytics API in the reference "Valuation
 * Snapshot" tiles (tinted blue boxes, figure over label over caption).
 */
export function SnapshotCard({ stats }: { stats: Stats }) {
  const tiles = METRICS.map((m) => ({
    ...m,
    value: statNumber(stats, m.metric),
  }))
    .filter((m) => m.value !== null)
    .slice(0, 6);
  if (tiles.length === 0) return null;

  return (
    <DataPanel
      title="Risk & Return Snapshot"
      bodyClassName="grid grid-cols-3 gap-2"
    >
      {tiles.map((t) => (
        <div
          key={t.metric}
          className="rounded-nested space-y-0.5 bg-[#063BAA]/4 p-3 text-center dark:bg-[#063BAA]/10"
        >
          <p className="font-geist text-base font-medium text-[#063BAA] tabular-nums dark:text-blue-400">
            {t.pct
              ? formatPct(t.value, {
                  signed:
                    t.metric === PortfolioMetric.Return1Y ||
                    t.metric === PortfolioMetric.CAGR,
                })
              : (t.value as number).toFixed(2)}
          </p>
          <p className="text-forest-deep text-[9px] font-medium dark:text-white">
            {t.label}
          </p>
          <p className="text-[8px] leading-none text-slate-400">{t.desc}</p>
        </div>
      ))}
    </DataPanel>
  );
}
