"use client";
import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";

export type TrendSeries = {
  key: string;
  name?: string;
  color: string;
  /** Benchmarks draw dashed, in the reference grey. */
  dashed?: boolean;
};

type TrendChartProps = {
  /** Chart rows (any object shape — interfaces welcome). */
  data: object[];
  xKey: string;
  series: TrendSeries[];
  /** `area` fills a single series with the reference gradient; `line` draws
   *  each series as a line; `bar` draws rounded-top columns. */
  kind?: "area" | "line" | "bar";
  height?: number;
  /** Numeric x (timestamps) spans the data range; otherwise categorical. */
  numericX?: boolean;
  xTickFormatter?: (v: unknown) => string;
  tooltipLabelFormatter?: (v: unknown) => string;
  valueFormatter?: (v: number) => string;
  /** Show the series legend (default: when there is more than one series). */
  showLegend?: boolean;
  /** Explicit x tick positions (e.g. month starts on a time axis). */
  xTicks?: number[];
};

/**
 * Time-series chart in the reference style (UI manual §11): X axis only, small
 * slate ticks, no grid, 2px strokes without dots, gradient area fill, rounded
 * bar tops and a compact rounded tooltip. Tick and tooltip sizes step up on
 * desktop the way the reference charts do.
 */
export function TrendChart({
  data,
  xKey,
  series,
  kind = "area",
  height = 120,
  numericX = false,
  xTickFormatter,
  tooltipLabelFormatter,
  valueFormatter = (v) => String(v),
  showLegend = series.length > 1,
  xTicks,
}: TrendChartProps) {
  const isDesktop = useIsDesktopWeb();
  const gradientId = `trend-${useId().replace(/:/g, "")}`;
  const tickFs = isDesktop ? 11 : 8;
  const tipFs = isDesktop ? "11.5px" : "9px";

  const xAxis = (
    <XAxis
      dataKey={xKey}
      {...(numericX
        ? {
            type: "number" as const,
            domain: ["dataMin", "dataMax"] as [string, string],
            scale: "time" as const,
          }
        : { interval: "preserveStartEnd" as const })}
      tickFormatter={xTickFormatter as ((v: unknown) => string) | undefined}
      ticks={xTicks}
      tick={{ fontSize: tickFs, fill: "#94A3B8" }}
      tickLine={false}
      axisLine={false}
      minTickGap={24}
      tickMargin={6}
    />
  );

  const tooltip = (
    <Tooltip
      contentStyle={{
        fontSize: tipFs,
        borderRadius: "8px",
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        color: "var(--text-color)",
      }}
      labelFormatter={
        tooltipLabelFormatter as ((v: unknown) => string) | undefined
      }
      formatter={(v, name) => [valueFormatter(Number(v)), name]}
      cursor={kind === "bar" ? { fill: "rgba(6,59,170,0.05)" } : undefined}
    />
  );

  const legend = showLegend ? (
    <Legend
      iconType={kind === "bar" ? "circle" : "plainline"}
      wrapperStyle={{ fontSize: tickFs + 1 }}
      formatter={(value) => <span style={{ color: "#94A3B8" }}>{value}</span>}
    />
  ) : null;

  const margin = { top: 5, right: 5, left: 5, bottom: 0 };

  return (
    <div
      className="w-full"
      style={{ height }}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        {kind === "area" ? (
          <AreaChart
            data={data}
            margin={margin}
          >
            <defs>
              {series.map((s, i) => (
                <linearGradient
                  key={s.key}
                  id={`${gradientId}-${i}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={s.color}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor={s.color}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>
            {xAxis}
            {tooltip}
            {legend}
            {series.map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name ?? s.key}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.dashed ? "3 3" : undefined}
                fill={s.dashed ? "transparent" : `url(#${gradientId}-${i})`}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </AreaChart>
        ) : kind === "line" ? (
          <LineChart
            data={data}
            margin={margin}
          >
            {xAxis}
            {tooltip}
            {legend}
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name ?? s.key}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.dashed ? "3 3" : undefined}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        ) : (
          <BarChart
            data={data}
            margin={margin}
          >
            {xAxis}
            {tooltip}
            {legend}
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name ?? s.key}
                fill={s.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
