"use client";

import type { FundamentalChartData } from "@/api/generated/report-apis/models";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  data: FundamentalChartData;
  className?: string;
  disableAnimation?: boolean;
};

/** Pretty-print a key like "operating_profit" to "Operating Profit" */
function formatKey(key: string): string {
  const labels: Record<string, string> = {
    interest_income: "Interest Income",
    revenue: "Revenue",
    operating_profit: "Operating Profit",
    net_profit: "Net Profit",
    operating_margin: "Operating Margin (%)",
    net_margin: "Net Profit Margin (%)",
  };
  return (
    labels[key] ??
    key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

/** Format large numbers (e.g. 186331 -> "1.86L" or "186,331") */
function formatValue(value: number): string {
  if (Math.abs(value) >= 100000) {
    return `${(value / 100000).toFixed(1)}L`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(1);
}

/** Check if a chart has at least one non-null data point across all series */
function hasValidData(
  data: Record<string, unknown>[],
  seriesKeys: string[],
): boolean {
  return data.some((row) =>
    seriesKeys.some((key) => row[key] !== null && row[key] !== undefined),
  );
}

export default function FundamentalChart({
  data: chartData,
  className,
  disableAnimation = false,
}: Props) {
  const { data, chart_type, colors, title, description } = chartData;

  // Determine series keys (all keys except "year")
  const seriesKeys =
    data.length > 0 ? Object.keys(data[0]).filter((k) => k !== "year") : [];

  // Skip rendering if no valid data
  if (!hasValidData(data, seriesKeys)) return null;

  const colorsMap = (colors ?? {}) as Record<string, string>;
  const ChartComponent = chart_type === "line" ? LineChart : BarChart;

  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <h5 className="text-sm font-semibold text-slate-700">{title}</h5>
      )}
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={data as Record<string, any>[]}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={formatValue} />
          <Tooltip
            formatter={(value: number, name: string) => [
              value?.toLocaleString() ?? "\u2014",
              formatKey(name),
            ]}
          />
          <Legend formatter={formatKey} />
          {seriesKeys.map((key) =>
            chart_type === "line" ? (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colorsMap[key] || "#035BFF"}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
                isAnimationActive={!disableAnimation}
              />
            ) : (
              <Bar
                key={key}
                dataKey={key}
                fill={colorsMap[key] || "#035BFF"}
                radius={[2, 2, 0, 0]}
                isAnimationActive={!disableAnimation}
              />
            ),
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
