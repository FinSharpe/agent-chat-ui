"use client";

import type { PeerChartData } from "@/api/generated/report-apis/models";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  data: PeerChartData;
  labelKey?: string;
  className?: string;
  disableAnimation?: boolean;
  hideLegend?: boolean;
};

/** Pretty-print metric keys */
function formatMetric(key: string): string {
  const labels: Record<string, string> = {
    pe: "P/E",
    pb: "P/B",
    ev_ebitda: "EV/EBITDA",
    roe: "ROE (3Y Avg)",
    roce: "ROCE (3Y Avg)",
    op_margin: "Op. Margin",
    net_margin: "Net Profit Margin",
  };
  return (
    labels[key] ??
    key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

/** Truncate long company names */
function truncateCompany(name: string, max = 15): string {
  if (name.length <= max) return name;
  return name.slice(0, max - 1) + "\u2026";
}

/** Check if chart has any valid data points */
function hasValidData(
  data: Record<string, unknown>[],
  metrics: string[],
): boolean {
  return data.some((row) =>
    metrics.some(
      (m) => row[m] !== null && row[m] !== undefined && row[m] !== 0,
    ),
  );
}

export default function PeerComparisonChart({
  data: chartData,
  labelKey = "company",
  className,
  disableAnimation = false,
  hideLegend = false,
}: Props) {
  const { data, metrics, colors, highlighted_company, title, description } =
    chartData;

  const colorsMap = (colors ?? {}) as Record<string, string>;
  const showLegend = !hideLegend;

  // Skip rendering if no valid data
  if (!hasValidData(data, metrics)) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <h5 className="text-sm font-semibold text-slate-700">{title}</h5>
      )}
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data as Record<string, any>[]}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey={labelKey}
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => truncateCompany(v)}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number, name: string) => [
              value?.toFixed(2) ?? "\u2014",
              formatMetric(name),
            ]}
          />
          {showLegend && <Legend formatter={formatMetric} />}
          {metrics.map((metric) => (
            <Bar
              key={metric}
              dataKey={metric}
              fill={colorsMap[metric] || "#035BFF"}
              radius={[2, 2, 0, 0]}
              isAnimationActive={!disableAnimation}
            >
              {data.map((entry, idx) => {
                const isHighlighted = (entry as Record<string, any>)[labelKey]
                  ?.toUpperCase()
                  .includes(highlighted_company?.toUpperCase());
                return (
                  <Cell
                    key={idx}
                    fillOpacity={isHighlighted ? 1 : 0.6}
                    stroke={
                      isHighlighted ? colorsMap[metric] || "#035BFF" : "none"
                    }
                    strokeWidth={isHighlighted ? 2 : 0}
                  />
                );
              })}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
