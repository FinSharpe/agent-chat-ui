"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Small hand-drawn charts from the reference analysis modals: an SVG donut
 * with a legend, a score ring, and thin progress-bar rows. Recharts is kept
 * for time series only (see TrendChart).
 */

/** Categorical palette of the reference donuts, in order. */
const DONUT_COLORS = [
  "#063BAA",
  "#F59E0B",
  "#0A9E6E",
  "#8B5CF6",
  "#06B6D4",
  "#455578",
  "#EC4899",
];

export type DonutSegment = { name: string; value: number; color?: string };

type Normalised = { name: string; pct: number; color: string; offset: number };

/**
 * Normalise raw weights to shares of 100 (absolute values, so long-short
 * weights still draw), keep the largest `max - 1` and fold the rest into
 * "Others" so the legend stays readable.
 */
function normalise(segments: DonutSegment[], max: number): Normalised[] {
  const clean = segments
    .map((s) => ({ ...s, value: Math.abs(Number(s.value) || 0) }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = clean.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return [];
  const head = clean.length > max ? clean.slice(0, max - 1) : clean;
  const rest = clean.length > max ? clean.slice(max - 1) : [];
  const rows = rest.length
    ? [
        ...head,
        { name: "Others", value: rest.reduce((s, r) => s + r.value, 0) },
      ]
    : head;
  let cum = 0;
  return rows.map((s, i) => {
    const pct = (s.value / total) * 100;
    const row = {
      name: s.name,
      pct,
      color: ("color" in s && s.color) || DONUT_COLORS[i % DONUT_COLORS.length],
      offset: -cum,
    };
    cum += pct;
    return row;
  });
}

/** SVG donut + legend (name · share) — the reference allocation block. */
export function DonutBreakdown({
  segments,
  size = "md",
  max = 6,
}: {
  segments: DonutSegment[];
  /** `sm` for the half-width Sectors / Market Cap cards. */
  size?: "sm" | "md";
  max?: number;
}) {
  const rows = normalise(segments, max);
  if (rows.length === 0) {
    return <p className="text-[10px] text-slate-400">No allocation data</p>;
  }
  const small = size === "sm";
  return (
    <div className={cn("flex items-center", small ? "gap-2" : "gap-4")}>
      <div
        className={cn("relative shrink-0", small ? "h-12 w-12" : "h-16 w-16")}
      >
        <svg
          className="h-full w-full -rotate-90"
          viewBox="0 0 36 36"
          aria-hidden
        >
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            stroke="currentColor"
            strokeWidth={small ? 2.5 : 3}
            className="text-slate-100 dark:text-slate-800"
          />
          {rows.map((seg) => (
            <circle
              key={seg.name}
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke={seg.color}
              strokeWidth={small ? 3 : 3.2}
              strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
              strokeDashoffset={seg.offset}
            />
          ))}
        </svg>
      </div>
      <div
        className={cn(
          "text-forest-deep min-w-0 flex-1 space-y-1 font-medium dark:text-white",
          small ? "text-[9px]" : "text-[10px]",
        )}
      >
        {rows.map((seg) => (
          <div
            key={seg.name}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: seg.color }}
              />
              <span
                className="truncate"
                title={seg.name}
              >
                {seg.name}
              </span>
            </div>
            <span className="shrink-0 tabular-nums">{seg.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Circular score gauge (value out of `max`) with the figure in the centre. */
export function ScoreRing({
  value,
  max = 100,
  colorClass = "text-[#063BAA] dark:text-[#8FB4FF]",
}: {
  value: number | null;
  max?: number;
  colorClass?: string;
}) {
  const share = value === null ? 0 : Math.max(0, Math.min(1, value / max));
  const arc =
    "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831";
  return (
    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
      <svg
        className="h-full w-full -rotate-90"
        viewBox="0 0 36 36"
        aria-hidden
      >
        <path
          className="text-slate-100 dark:text-slate-800"
          strokeWidth="3"
          stroke="currentColor"
          fill="none"
          d={arc}
        />
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: share }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={colorClass}
          strokeWidth="3.2"
          strokeLinecap="round"
          stroke="currentColor"
          fill="none"
          d={arc}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-geist text-forest-deep text-xl font-medium tabular-nums dark:text-white">
          {value === null ? "—" : Math.round(value)}
        </span>
        <span className="text-[8px] leading-none text-slate-400">/{max}</span>
      </div>
    </div>
  );
}

/** Label + value on one line, thin animated bar underneath (score metrics). */
export function MeterRow({
  label,
  valueLabel,
  pct,
  barClass,
}: {
  label: string;
  valueLabel: string;
  /** 0–100 fill. */
  pct: number;
  barClass: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-forest-deep flex justify-between gap-2 font-medium dark:text-white">
        <span className="truncate">{label}</span>
        <span className="shrink-0 tabular-nums">{valueLabel}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          transition={{ duration: 0.8 }}
          className={cn("h-full", barClass)}
        />
      </div>
    </div>
  );
}

/** Fixed-width label, bar, value — the reference XIRR / quality-score rows. */
export function BarRow({
  label,
  valueLabel,
  pct,
  barClass,
  title,
}: {
  label: string;
  valueLabel: string;
  pct: number;
  barClass: string;
  title?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-forest-deep w-24 shrink-0 truncate dark:text-white"
        title={title ?? label}
      >
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          transition={{ duration: 0.8 }}
          className={cn("h-full", barClass)}
        />
      </div>
      <span className="text-forest-deep w-11 shrink-0 text-right font-medium tabular-nums dark:text-white">
        {valueLabel}
      </span>
    </div>
  );
}
