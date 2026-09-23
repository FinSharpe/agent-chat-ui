"use client";

import { useEffect, useState } from "react";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import type { DistributionItem } from "@/api/generated/portfolio-apis/models";
import type { ReturnsChartData } from "@/api/generated/portfolio-apis/models";
import { cn } from "@/lib/utils";
import { ResultLabel } from "./BasketResultView";

/** The reference's performance palette: this basket, then the benchmark,
 *  then anything further as a dashed slate line. */
const SERIES_STYLE = [
  { stroke: "#063BAA", width: 2 },
  { stroke: "#97edcc", width: 2 },
  { stroke: "#455578", width: 1.5, dash: "3 3" },
];

const MONTH = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "2-digit",
});

function seriesName(key: string): string {
  return key === "PORTFOLIO" ? "This Basket" : key;
}

/**
 * Cumulative returns of the basket against its benchmark, drawn the way the
 * reference draws a strategy's performance: no axis chrome beyond the dates,
 * a legend, a hover readout.
 */
export function PerformanceSection({ chart }: { chart: ReturnsChartData }) {
  // Recharts measures its container, which only exists after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const keys = Object.keys(chart.data?.[0] ?? {}).filter(
    (key) => key !== "date",
  );
  if (!chart.data?.length || !keys.length) return null;

  return (
    <section className="py-5">
      <ResultLabel>{chart.title || "Performance"}</ResultLabel>
      {chart.description && (
        <p className="mt-0.5 text-[10px] text-slate-400">{chart.description}</p>
      )}
      {mounted && (
        <div className="mt-3 h-52 w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={chart.data}
              margin={{ top: 5, right: 5, left: 5, bottom: 0 }}
            >
              <XAxis
                dataKey="date"
                type="number"
                domain={["dataMin", "dataMax"]}
                scale="time"
                tickFormatter={(value) => MONTH.format(new Date(value))}
                tick={{ fontSize: 9, fill: "#455578" }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <Tooltip
                labelFormatter={(value) =>
                  new Date(Number(value)).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                }
                formatter={(value: number, name: string) => [
                  `${Number(value).toFixed(2)}%`,
                  name,
                ]}
                contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
              />
              <Legend
                iconType="plainline"
                wrapperStyle={{ fontSize: "10px" }}
                // Series names in slate: the mint benchmark line is too
                // light to carry its own label on white.
                formatter={(value) => (
                  <span style={{ color: "#455578" }}>{value}</span>
                )}
              />
              {keys.map((key, index) => {
                const style = SERIES_STYLE[Math.min(index, 2)];
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={seriesName(key)}
                    stroke={style.stroke}
                    strokeWidth={style.width}
                    strokeDasharray={style.dash}
                    dot={false}
                    isAnimationActive={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

/** A distribution as the reference's allocation bars, largest first. */
export function AllocationSection({
  title,
  items,
}: {
  title: string;
  items: DistributionItem[];
}) {
  if (!items?.length) return null;
  const sorted = [...items].sort(
    (a, b) => Math.abs(b.value) - Math.abs(a.value),
  );
  return (
    <section className="py-5">
      <ResultLabel>{title}</ResultLabel>
      <div className="mt-3 space-y-1.5">
        {sorted.map((item) => (
          <div
            key={item.name}
            className="space-y-0.5"
          >
            <div className="flex justify-between gap-3 text-[10px]">
              <span className="truncate font-medium text-[#0A1F4D]">
                {item.name}
              </span>
              <span className="shrink-0 text-slate-400 tabular-nums">
                {item.value.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#063BAA]"
                style={{ width: `${Math.min(100, Math.abs(item.value))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Label/value rows split by hairlines — the reference's key-metrics list. */
export function MetricRowsSection({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: { label: string; values: string[]; tone?: "up" | "down" }[];
  /** Headers for the value columns, when there is more than one. */
  columns?: string[];
}) {
  if (!rows.length) return null;
  return (
    <section className="py-5">
      <div className="flex items-center justify-between gap-3">
        <ResultLabel>{title}</ResultLabel>
        {columns && columns.length > 1 && (
          <div className="flex text-[9px] font-medium tracking-wider text-slate-400 uppercase">
            {columns.map((column) => (
              <span
                key={column}
                className="w-20 text-right"
              >
                {column}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="mt-1 divide-y divide-slate-100 dark:divide-slate-800/60">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <span className="min-w-0 truncate text-[11px] text-slate-500 dark:text-slate-400">
              {row.label}
            </span>
            <div className="flex shrink-0">
              {row.values.map((value, index) => (
                <span
                  key={index}
                  className={cn(
                    "text-right text-[11px] tabular-nums",
                    row.values.length > 1 && "w-20",
                    index === 0
                      ? "font-medium text-[#0A1F4D] dark:text-white"
                      : "text-slate-400",
                  )}
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
