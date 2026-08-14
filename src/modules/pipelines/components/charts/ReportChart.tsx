"use client";

/**
 * One chart of a Report Section, drawn from the frozen `ChartSpec`.
 *
 * The frame is the contract: a title, a **mandatory** vintage stamp (a chart
 * without one would silently claim to be current), a legend whenever there is
 * more than one series, a hover layer, and a table view. The plot itself is
 * whichever recharts primitive the wire's `kind` names; an unknown kind falls
 * back to a line rather than rendering nothing.
 */

import { useMemo, useState, type ComponentProps } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { cn } from "@/lib/utils";
import { useChartTokens } from "../../hooks/useChartTokens";
import { vintageStampText } from "../../constants/presentation";
import type { ChartSpec } from "../../types/pipelines.types";
import {
  formatNumber,
  formatX,
  formatXLong,
  isStrokeChart,
  prepareChart,
  type PreparedChart,
} from "../../utils/chart-data";
import { ChartTableView } from "./ChartTableView";

const AXIS_FONT = 11;

/** The one-sentence summary a screen reader gets instead of the plot. */
function chartSummary(spec: ChartSpec): string {
  const kind =
    spec.kind === "bar"
      ? "Bar chart"
      : spec.kind === "area"
        ? "Area chart"
        : spec.kind === "scatter"
          ? "Scatter plot"
          : "Line chart";
  const names = (spec.series ?? []).map((s) => s.name).join(", ");
  return `${kind}. ${spec.title}. Series: ${names}. ${vintageStampText(spec.vintage)}. The table below carries the same values.`;
}

function ChartTooltip({
  active,
  payload,
  label,
  chart,
}: {
  active?: boolean;
  payload?: { dataKey?: string | number; value?: number | null }[];
  label?: string | number;
  chart: PreparedChart;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border-default bg-bg-card rounded-md border px-3 py-2 text-xs shadow-md">
      <p className="text-text-primary mb-1 font-medium">
        {formatXLong(label, chart.xKind)}
      </p>
      {chart.series.map((series) => {
        const entry = payload.find((p) => p.dataKey === series.key);
        if (!entry || entry.value === null || entry.value === undefined) {
          return null;
        }
        return (
          <p
            key={series.key}
            className="text-text-secondary flex items-center justify-between gap-4"
          >
            <span>{series.name}</span>
            <span className="text-text-primary tabular-nums">
              {formatNumber(entry.value)}
            </span>
          </p>
        );
      })}
    </div>
  );
}

export function ReportChart({ spec }: { spec: ChartSpec }) {
  const [showTable, setShowTable] = useState(false);
  const tokens = useChartTokens();
  const chart = useMemo(() => prepareChart(spec), [spec]);

  const colorOf = (colorVar: string) => tokens[colorVar] ?? tokens["--chart-1"];
  const hasSeries = chart.series.length > 0 && chart.data.length > 0;
  const height = spec.hero ? 300 : 220;

  const axisProps = {
    stroke: tokens["--text-tertiary"],
    tick: { fontSize: AXIS_FONT, fill: tokens["--text-tertiary"] },
    tickLine: false,
    axisLine: false,
  };

  const commonMargin = { top: 8, right: 12, bottom: 4, left: 0 };

  const grid = (
    <CartesianGrid
      stroke={tokens["--chart-grid"]}
      strokeDasharray="3 3"
      vertical={false}
    />
  );

  const xAxis = (
    <XAxis
      dataKey="x"
      type={chart.xKind === "category" ? "category" : "number"}
      domain={chart.xKind === "category" ? undefined : ["dataMin", "dataMax"]}
      scale={chart.xKind === "category" ? "auto" : "linear"}
      ticks={chart.xTicks}
      tickFormatter={(value) => formatX(value, chart.xKind)}
      minTickGap={28}
      {...axisProps}
    />
  );

  // A bar is read against zero, so its axis keeps the origin. A line is read
  // as a shape — anchoring a rebased price series at zero would spend most of
  // the plot on empty space below the data.
  const yAxis = (domain?: ComponentProps<typeof YAxis>["domain"]) => (
    <YAxis
      width={52}
      domain={domain}
      tickFormatter={(value) => formatNumber(value)}
      {...axisProps}
    />
  );

  const tooltip = (
    <Tooltip
      content={<ChartTooltip chart={chart} />}
      cursor={{ stroke: tokens["--text-tertiary"], strokeWidth: 1 }}
    />
  );

  function renderPlot() {
    switch (spec.kind) {
      case "bar":
        return (
          <BarChart
            data={chart.data}
            margin={commonMargin}
            barGap={2}
          >
            {grid}
            {/* A bar sits in a slot, not at a coordinate — the axis is
                categorical whatever the underlying x holds, and the rows are
                already sorted by that underlying value. */}
            <XAxis
              dataKey="xLabel"
              type="category"
              interval="preserveStartEnd"
              {...axisProps}
            />
            {yAxis()}
            {tooltip}
            {chart.series.map((series) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.name}
                fill={colorOf(series.colorVar)}
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        );

      case "area":
        return (
          <AreaChart
            data={chart.data}
            margin={commonMargin}
          >
            <defs>
              {chart.series.map((series) => (
                <linearGradient
                  key={series.key}
                  id={`fill-${spec.id}-${series.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={colorOf(series.colorVar)}
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="100%"
                    stopColor={colorOf(series.colorVar)}
                    stopOpacity={0.04}
                  />
                </linearGradient>
              ))}
            </defs>
            {grid}
            {xAxis}
            {yAxis([
              (min: number) => Math.min(0, min),
              (max: number) => Math.max(0, max),
            ])}
            {tooltip}
            {/* The area hangs from the zero rule: a drawdown is a distance
                below the high, not a quantity above the axis floor. */}
            <ReferenceLine
              y={0}
              stroke={tokens["--text-tertiary"]}
            />
            {chart.series.map((series) => (
              <Area
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.name}
                baseValue={0}
                stroke={colorOf(series.colorVar)}
                strokeWidth={2}
                strokeDasharray={series.dash}
                fill={`url(#fill-${spec.id}-${series.key})`}
                connectNulls={false}
                isAnimationActive={false}
                dot={false}
              />
            ))}
          </AreaChart>
        );

      case "scatter":
        return (
          <ScatterChart margin={{ ...commonMargin, top: 20, right: 24 }}>
            {grid}
            {/* Padded on both axes: with two points the auto domain puts each
                one exactly on an edge, where its dot and its label are half
                outside the plot. */}
            {/* Padding rather than a widened domain: with two points, pushing
                the bounds out would make the bounds themselves the ticks, and
                the axis would read 12.29 / 14.29 / 17.89 instead of round
                numbers. Pixel padding keeps the dots and their labels off the
                edges while recharts still picks the scale. */}
            <XAxis
              dataKey="x"
              type="number"
              domain={["auto", "auto"]}
              padding={{ left: 36, right: 36 }}
              tickFormatter={(value) => formatX(value, chart.xKind)}
              {...axisProps}
            />
            <YAxis
              dataKey="y"
              type="number"
              domain={["auto", "auto"]}
              padding={{ top: 24, bottom: 16 }}
              width={52}
              tickFormatter={(value) => formatNumber(value)}
              {...axisProps}
            />
            <ZAxis range={[150, 150]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as {
                  name: string;
                  x: number;
                  y: number;
                };
                return (
                  <div className="border-border-default bg-bg-card rounded-md border px-3 py-2 text-xs shadow-md">
                    <p className="text-text-primary font-medium">
                      {point.name}
                    </p>
                    <p className="text-text-secondary">
                      {formatNumber(point.x)} · {formatNumber(point.y)}
                    </p>
                  </div>
                );
              }}
            />
            {chart.series.map((series) => {
              // A scatter of positions: one dot per series, labelled in place
              // so identity survives greyscale and needs no legend lookup.
              const points = chart.data
                .filter((row) => row[series.key] !== null)
                .map((row) => ({
                  x: Number(row.x),
                  y: row[series.key] as number,
                  name: series.name,
                }));
              return (
                <Scatter
                  key={series.key}
                  data={points}
                  name={series.name}
                  fill={colorOf(series.colorVar)}
                  isAnimationActive={false}
                >
                  {chart.isSinglePoint && (
                    // Drawn by hand rather than with `position="top"`: the
                    // built-in label word-wraps inside the symbol's width, so
                    // "Nifty 50" comes out stacked on two lines.
                    <LabelList
                      dataKey="name"
                      content={(props) => {
                        const { x, y, width, value } = props as {
                          x?: number;
                          y?: number;
                          width?: number;
                          value?: string;
                        };
                        if (x === undefined || y === undefined) return null;
                        return (
                          <text
                            x={x + (width ?? 0) / 2}
                            y={y - 10}
                            textAnchor="middle"
                            fill={tokens["--text-tertiary"]}
                            fontSize={AXIS_FONT}
                          >
                            {value}
                          </text>
                        );
                      }}
                    />
                  )}
                </Scatter>
              );
            })}
          </ScatterChart>
        );

      // "line" and anything the wire invents later.
      default:
        return (
          <LineChart
            data={chart.data}
            margin={commonMargin}
          >
            {grid}
            {xAxis}
            {yAxis(["auto", "auto"])}
            {tooltip}
            {chart.series.map((series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.name}
                stroke={colorOf(series.colorVar)}
                strokeWidth={2}
                strokeDasharray={series.dash}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        );
    }
  }

  return (
    <figure
      className={cn(
        "border-border-default bg-bg-card rounded-lg border p-4",
        spec.hero && "md:p-5",
      )}
    >
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h4
          className={cn(
            "text-text-primary font-medium",
            spec.hero ? "text-base" : "text-sm",
          )}
        >
          {spec.title}
        </h4>
        {/* Never optional: the reader has to know how old this is. */}
        <span className="text-text-tertiary text-xs">
          {vintageStampText(spec.vintage)}
        </span>
      </figcaption>

      {chart.series.length > 1 && (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
          {chart.series.map((series) => (
            <li
              key={series.key}
              className="text-text-secondary flex items-center gap-1.5 text-xs"
            >
              {/* The swatch is the mark: a stroke for line and area (dash
                  pattern included, since that is what separates a subject's
                  own series), a filled shape for bar and scatter. */}
              <svg
                width="18"
                height="10"
                aria-hidden="true"
              >
                {isStrokeChart(spec.kind) ? (
                  <line
                    x1="0"
                    y1="5"
                    x2="18"
                    y2="5"
                    stroke={colorOf(series.colorVar)}
                    strokeWidth={2}
                    strokeDasharray={series.dash}
                  />
                ) : spec.kind === "scatter" ? (
                  <circle
                    cx="9"
                    cy="5"
                    r="4.5"
                    fill={colorOf(series.colorVar)}
                  />
                ) : (
                  <rect
                    x="1"
                    y="0"
                    width="16"
                    height="10"
                    rx="2"
                    fill={colorOf(series.colorVar)}
                  />
                )}
              </svg>
              {series.name}
              {series.role === "benchmark" && (
                <span className="text-text-tertiary">(benchmark)</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {hasSeries ? (
        <>
          <div
            role="img"
            aria-label={chartSummary(spec)}
            style={{ width: "100%", height }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              {renderPlot()}
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setShowTable((open) => !open)}
              className="text-text-tertiary hover:text-text-primary text-xs underline underline-offset-2"
              aria-expanded={showTable}
            >
              {showTable ? "Hide values" : "Show values"}
            </button>
          </div>
          {showTable && (
            <div className="mt-2">
              <ChartTableView chart={chart} />
            </div>
          )}
        </>
      ) : (
        <p className="text-text-tertiary py-8 text-center text-sm">
          This chart carries no data points.
        </p>
      )}
    </figure>
  );
}
