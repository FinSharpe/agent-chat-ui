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
    <div className="border-border-default max-h-72 overflow-auto rounded-md border">
      <table className="w-full text-left text-xs">
        <thead className="bg-bg-subtle text-text-secondary sticky top-0">
          <tr>
            <th
              scope="col"
              className="px-3 py-2 font-medium"
            >
              {xLabel || (chart.xKind === "date" ? "Date" : "Point")}
            </th>
            {chart.series.map((series) => (
              <th
                key={series.key}
                scope="col"
                className="px-3 py-2 text-right font-medium"
              >
                {series.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.data.map((row, index) => (
            <tr
              key={String(row.x) + index}
              className="border-border-subtle border-t"
            >
              <th
                scope="row"
                className="text-text-secondary px-3 py-1.5 font-normal"
              >
                {formatXLong(row.x, chart.xKind)}
              </th>
              {chart.series.map((series) => (
                <td
                  key={series.key}
                  className="text-text-primary px-3 py-1.5 text-right tabular-nums"
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
