"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { HoldingCell, StrategyDetailModel } from "../../types/discover.types";
import { AllocBars, DetailLabel, KeyValueRows } from "../shared/DetailKit";
import { BenchmarkChart, PerformanceChart } from "./DetailCharts";

export type TabId = StrategyDetailModel["tabs"][number];

const TAB_LABELS: Record<TabId, string> = {
  overview: "Overview",
  holdings: "Holdings",
  performance: "Performance",
  analytics: "Analytics",
};

const HOLDING_WIDTHS = ["w-20", "w-24", "w-20"];
// Reference table: a muted weight, the middle column in navy, the last muted.
const HOLDING_COLORS = [
  "text-slate-500 dark:text-slate-400",
  "text-[#0A1F4D] dark:text-white",
  "text-slate-500 dark:text-slate-400",
];

function Cell({ c, index }: { c: HoldingCell; index: number }) {
  const tone =
    c.tone === "up"
      ? "text-[#0A9E6E]"
      : c.tone === "down"
        ? "text-rose-500"
        : "";
  return (
    <span
      className={`${HOLDING_WIDTHS[index]} flex items-center justify-end gap-0.5 text-right text-[11px] tabular-nums ${tone || HOLDING_COLORS[index]} ${c.arrow ? "font-medium" : ""}`}
    >
      {c.arrow &&
        (c.tone === "down" ? (
          <TrendingDown size={10} />
        ) : (
          <TrendingUp size={10} />
        ))}
      {c.text}
    </span>
  );
}

/** Score bar: green when the score is good, amber mid-range, rose when poor. */
function ScoreBars({
  scores,
}: {
  scores: StrategyDetailModel["analytics"]["scores"];
}) {
  return (
    <div className="space-y-3">
      {scores.map((s) => {
        const goodness = s.higherIsBetter ? s.value : 100 - s.value;
        const color =
          goodness > 60
            ? "bg-[#0A9E6E]"
            : goodness >= 30
              ? "bg-amber-500"
              : "bg-rose-500";
        return (
          <div
            key={s.label}
            className="space-y-1"
          >
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">
                {s.label}
              </span>
              <span className="font-medium text-[#0A1F4D] tabular-nums dark:text-white">
                {Math.round(s.value)} / 100
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${Math.min(Math.max(s.value, 0), 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The pill tab bar and its cardless content — each section a label plus its
 * content, separated by hairlines.
 */
export function DetailTabs({
  model,
  tab,
  onTab,
  inPopup,
}: {
  model: StrategyDetailModel;
  tab: TabId;
  onTab: (t: TabId) => void;
  inPopup: boolean;
}) {
  const { overview, holdings, performance, analytics } = model;

  return (
    <>
      <div
        className={`scrollbar-none flex gap-2 overflow-x-auto px-5 ${inPopup ? "py-5" : "py-3.5"}`}
      >
        {model.tabs.map((t) => (
          <button
            key={t}
            onClick={() => onTab(t)}
            className={`${inPopup ? "flex-1 text-center" : "px-4"} rounded-full py-2 text-[11px] font-medium whitespace-nowrap transition-colors ${tab === t ? "bg-[#063BAA] text-white" : "bg-[#063BAA]/6 text-slate-500"}`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="divide-y divide-slate-100 px-5 dark:divide-slate-800/60">
        {tab === "overview" && (
          <>
            {overview.keyMetrics.length > 0 && (
              <section className="pt-1 pb-5">
                <DetailLabel>Key Metrics</DetailLabel>
                <div className="mt-1">
                  <KeyValueRows rows={overview.keyMetrics} />
                </div>
              </section>
            )}
            {overview.sectorAllocation.length > 0 && (
              <section className="py-5">
                <DetailLabel>{overview.sectorLabel}</DetailLabel>
                <div className="mt-3">
                  <AllocBars
                    data={overview.sectorAllocation}
                    signed={overview.signed}
                  />
                </div>
              </section>
            )}
            {overview.marketCapAllocation.length > 0 && (
              <section className="py-5">
                <DetailLabel>Market Cap Allocation</DetailLabel>
                <div className="mt-3">
                  <AllocBars
                    data={overview.marketCapAllocation}
                    signed={overview.signed}
                  />
                </div>
              </section>
            )}
            {!!overview.excluded?.length && (
              <section className="py-5">
                <DetailLabel>Excluded from analytics</DetailLabel>
                <p className="mt-2 px-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  These holdings are missing market data, so the figures above
                  leave them out.
                </p>
                <div className="mt-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {overview.excluded.map((h) => (
                    <div
                      key={h.ticker}
                      className="flex items-center gap-3 py-2.5 text-[11px]"
                    >
                      <span className="w-24 truncate font-medium text-[#0A1F4D] dark:text-white">
                        {h.ticker}
                      </span>
                      <span className="flex-1 truncate text-slate-500 dark:text-slate-400">
                        {h.reason}
                      </span>
                      <span className="text-slate-500 tabular-nums dark:text-slate-400">
                        {h.weight}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {tab === "holdings" && (
          <section className="pt-1 pb-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-[9px] font-medium tracking-wider text-slate-400 uppercase dark:border-slate-800/60">
              <span className="flex-1">Stock</span>
              {holdings.columns.map((c, i) => (
                <span
                  key={c}
                  className={`${HOLDING_WIDTHS[i]} text-right`}
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {holdings.rows.map((h) => (
                <div
                  key={h.key}
                  className="flex items-center py-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-medium text-[#0A1F4D] dark:text-white">
                      {h.name}
                    </span>
                    {h.sub && (
                      <span className="block truncate text-[10px] text-slate-400">
                        {h.sub}
                      </span>
                    )}
                  </span>
                  {h.cells.map((c, i) => (
                    <Cell
                      key={i}
                      c={c}
                      index={i}
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "performance" && (
          <section className="pt-1 pb-5">
            <DetailLabel>{performance.label}</DetailLabel>
            {performance.data.length > 0 ? (
              <PerformanceChart
                data={performance.data}
                series={performance.series}
                xKey={performance.xKey}
                inPopup={inPopup}
                unit={performance.unit}
              />
            ) : (
              <p className="mt-3 px-0.5 text-[11px] text-slate-400">
                No return history yet.
              </p>
            )}
            {performance.caption && (
              <p className="mt-2 px-0.5 text-[10px] leading-relaxed text-slate-400">
                {performance.caption}
              </p>
            )}
          </section>
        )}

        {tab === "analytics" && (
          <>
            {analytics.benchmark && (
              <section className="pt-1 pb-5">
                <DetailLabel>Benchmark Comparison</DetailLabel>
                <BenchmarkChart
                  data={analytics.benchmark.data}
                  series={analytics.benchmark.series}
                  xKey="name"
                  inPopup={inPopup}
                />
              </section>
            )}
            {analytics.scores.length > 0 && (
              <section className={analytics.benchmark ? "py-5" : "pt-1 pb-5"}>
                <DetailLabel>FinSharpe Scores</DetailLabel>
                <div className="mt-3">
                  <ScoreBars scores={analytics.scores} />
                </div>
              </section>
            )}
            {analytics.risk.length > 0 && (
              <section
                className={
                  analytics.benchmark || analytics.scores.length
                    ? "py-5"
                    : "pt-1 pb-5"
                }
              >
                <DetailLabel>Risk Analysis</DetailLabel>
                <div className="mt-1">
                  <KeyValueRows rows={analytics.risk} />
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
