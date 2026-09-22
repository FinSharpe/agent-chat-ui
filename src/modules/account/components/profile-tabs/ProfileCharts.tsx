"use client";

import React, { useId, useLayoutEffect, useRef, useState } from "react";
import { Area, AreaChart, Bar, BarChart, Tooltip, XAxis } from "recharts";

/* Recharts lives in its own chunk (see ProfileKit's dynamic import): the
   shell mounts the account overlays on every page, and the charts are only
   drawn once someone opens Profile Settings. */

type Datum = Record<string, string | number>;

const TICK = { fontSize: 8, fill: "#455578" };
const TOOLTIP_STYLE = { fontSize: "9px", borderRadius: "8px" };

/**
 * Fills its parent and hands the chart that size. Used instead of
 * ResponsiveContainer, whose first measurement (getBoundingClientRect) is in
 * zoomed pixels inside the desktop frame's CSS zoom, so charts first drew
 * ~7% too large. clientWidth/Height are layout pixels, unaffected by zoom.
 */
function Sized({
  children,
}: {
  children: (width: number, height: number) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () =>
      setSize((s) =>
        s.width === el.clientWidth && s.height === el.clientHeight
          ? s
          : { width: el.clientWidth, height: el.clientHeight },
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="h-full w-full"
    >
      {size.width > 0 && size.height > 0 && children(size.width, size.height)}
    </div>
  );
}

export function UsageAreaChart({
  data,
  xKey,
}: {
  data: Datum[];
  xKey: string;
}) {
  const gradId = `usageGrad-${useId().replace(/:/g, "")}`;
  return (
    <Sized>
      {(width, height) => (
        <AreaChart
          width={width}
          height={height}
          data={data}
          margin={{ top: 5, right: 5, left: -30, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id={gradId}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#063BAA"
                stopOpacity={0.35}
              />
              <stop
                offset="100%"
                stopColor="#063BAA"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <XAxis
            dataKey={xKey}
            tick={TICK}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Area
            type="monotone"
            dataKey="v"
            stroke="#063BAA"
            strokeWidth={2}
            fill={`url(#${gradId})`}
          />
        </AreaChart>
      )}
    </Sized>
  );
}

export function UsageBarChart({
  data,
  xKey,
  fill,
  left = -30,
}: {
  data: Datum[];
  xKey: string;
  fill: string;
  left?: number;
}) {
  return (
    <Sized>
      {(width, height) => (
        <BarChart
          width={width}
          height={height}
          data={data}
          margin={{ top: 5, right: 5, left, bottom: 0 }}
        >
          <XAxis
            dataKey={xKey}
            tick={TICK}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar
            dataKey="v"
            fill={fill}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      )}
    </Sized>
  );
}
