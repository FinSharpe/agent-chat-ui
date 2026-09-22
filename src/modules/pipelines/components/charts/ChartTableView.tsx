"use client";

/**
 * The table behind every chart.
 *
 * Present for three reasons at once: it is the accessible reading of the plot,
 * it is the relief a below-3:1 series colour obliges, and it is the only
 * correct reading of `fundamental_ratios`, whose five metrics share one axis
 * while carrying five different units (Phase 6 finding, still open on Phase 2).
 */

import {
  formatNumber,
  formatXLong,
  type PreparedChart,
} from "../../utils/chart-data";

export function ChartTableView({
  chart,
  xLabel = "",
}: {
  chart: PreparedChart;
  xLabel?: string;
}) {
  return (
    <div className="scrollbar-none rounded-nested max-h-72 overflow-auto border border-slate-100 dark:border-slate-800/60">
      <table className="w-full text-left text-[11px]">
        <thead className="sticky top-0 bg-white dark:bg-[#0C1524]">
          <tr className="border-b border-slate-100 dark:border-slate-800/60">
            <th
              scope="col"
              className="px-3 py-2 text-[9px] font-medium tracking-wider text-slate-400 uppercase"
            >
              {xLabel || (chart.xKind === "date" ? "Date" : "Point")}
            </th>
            {chart.series.map((series) => (
              <th
                key={series.key}
                scope="col"
                className="px-3 py-2 text-right text-[9px] font-medium tracking-wider text-slate-400 uppercase"
              >
                {series.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {chart.data.map((row, index) => (
            <tr key={String(row.x) + index}>
              <th
                scope="row"
                className="px-3 py-1.5 font-normal text-slate-500 dark:text-slate-400"
              >
                {formatXLong(row.x, chart.xKind)}
              </th>
              {chart.series.map((series) => (
                <td
                  key={series.key}
                  className="px-3 py-1.5 text-right text-[#0A1F4D] tabular-nums dark:text-white"
                >
                  {formatNumber(row[series.key] as number | null)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
