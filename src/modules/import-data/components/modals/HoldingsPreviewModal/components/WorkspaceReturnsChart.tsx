"use client";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useIsMobile } from "@/hooks/useIsMobile";
import { chartSeriesColor } from "@/lib/chart-colors";
import { AnalysisCard } from "./AnalysisCard";

/** Loose shape covering both the equity and MF `returns_chart_data` payloads.
 * Rows are date-keyed records of `{ date, <series>: returnPct }`. */
type ReturnsChart = {
  data?: Array<Record<string, unknown>>;
  colors?: Record<string, string>;
  title?: string;
  description?: string;
};

const fmtMonth = (t: number) =>
  new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(
    new Date(t),
  );
const fmtFull = (t: number) =>
  new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(t));

/**
 * Theme-aligned cumulative-returns line (portfolio vs benchmark). The shared
 * chat `LineChart` is hard-wired to `min-w-3xl` and gray-50 styling, so the
 * split-canvas needs its own compact, tokenised chart.
 */
export function WorkspaceReturnsChart({ data }: { data: ReturnsChart }) {
  const isMobile = useIsMobile();
  const rows = data?.data ?? [];
  const seriesKeys = Object.keys(rows[0] ?? {}).filter((k) => k !== "date");

  return (
    <AnalysisCard title={data?.title || "Cumulative Returns"}>
      {data?.description && (
        <p className="text-text-muted -mt-0.5 mb-3 text-xs">
          {data.description}
        </p>
      )}
      <ResponsiveContainer
        width="100%"
        height={240}
      >
        <RLineChart
          data={rows}
          margin={{ top: 6, right: 8, left: isMobile ? -4 : -6, bottom: 0 }}
        >
          <CartesianGrid
            stroke="var(--chart-grid)"
            strokeDasharray="4 4"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={fmtMonth}
            fontSize={11}
            tickMargin={8}
            minTickGap={28}
            stroke="var(--text-muted)"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            unit="%"
            tickFormatter={(v) => `${Number(v).toFixed(0)}`}
            fontSize={11}
            width={44}
            stroke="var(--text-muted)"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              fontSize: 12,
              color: "var(--text-primary)",
              boxShadow: "0 8px 24px -12px rgba(15, 23, 42, 0.25)",
            }}
            labelFormatter={(l) => fmtFull(Number(l))}
            formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name]}
          />
          <Legend
            iconType="plainline"
            wrapperStyle={{ fontSize: 12 }}
          />
          {seriesKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              dot={false}
              stroke={data?.colors?.[key] || chartSeriesColor(i)}
              strokeWidth={2.25}
            />
          ))}
        </RLineChart>
      </ResponsiveContainer>
    </AnalysisCard>
  );
}
