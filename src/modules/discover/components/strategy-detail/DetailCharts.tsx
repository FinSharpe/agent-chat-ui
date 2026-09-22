"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { ChartSeries } from "../../types/discover.types";

interface ChartProps {
  data: Record<string, number | string>[];
  series: ChartSeries[];
  xKey: string;
  inPopup: boolean;
  unit?: string;
}

/* The phone screens use 8–9px chart text; the popup steps it up with the
   rest of its type scale. */
const fonts = (inPopup: boolean) => ({
  tick: inPopup ? 11 : 8,
  tip: inPopup ? "11.5px" : "9px",
});

const formatValue = (unit?: string) => (v: unknown) =>
  typeof v === "number"
    ? `${Number.isInteger(v) ? v : v.toFixed(1)}${unit ?? ""}`
    : String(v);

/** Recharts measures on mount — render only once the client has laid out. */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function PerformanceChart({
  data,
  series,
  xKey,
  inPopup,
  unit,
}: ChartProps) {
  const mounted = useMounted();
  const f = fonts(inPopup);
  if (!mounted) return null;
  return (
    <div className="mt-3 h-52 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <LineChart
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: f.tick, fill: "#455578" }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <Tooltip
            contentStyle={{ fontSize: f.tip, borderRadius: "8px" }}
            formatter={formatValue(unit)}
          />
          <Legend
            iconType="plainline"
            wrapperStyle={{ fontSize: f.tip }}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={s.width ?? 2}
              strokeDasharray={s.dashed ? "3 3" : undefined}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BenchmarkChart({ data, series, xKey, inPopup }: ChartProps) {
  const mounted = useMounted();
  const f = fonts(inPopup);
  if (!mounted) return null;
  return (
    <div className="mt-3 h-40 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: f.tick, fill: "#455578" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ fontSize: f.tip, borderRadius: "8px" }}
            formatter={formatValue("%")}
          />
          <Legend wrapperStyle={{ fontSize: f.tip }} />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
