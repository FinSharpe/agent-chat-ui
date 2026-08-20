/**
 * Wire `ChartSpec` → something recharts can draw.
 *
 * Two things the wire does not do for us:
 *
 * 1. **Series carry independent x grids.** Each is its own `[[x, y], …]` list
 *    with no shared axis, so they are unioned onto one and the holes are left
 *    as `null` — which is where a line breaks its stroke rather than
 *    interpolating across missing data. (The print system solves the same
 *    problem in `series_to_columns`.)
 * 2. **x is untyped.** It may be an ISO date, a number (a strike, a
 *    volatility) or a category label, and which one it is decides the axis.
 *
 * Colour is assigned by *role*, never by position: the subject's own history
 * is the brand hue and the comparison series is the reserved achromatic
 * benchmark, so a filter or a reordering can never repaint them. Where a chart
 * has several of the subject's own series, strokes separate them by dash
 * pattern (a price and its two moving averages are not three peers) and marks
 * — which have no stroke to dash — step through the validated categorical
 * order instead.
 *
 * `peer` is the case that rule was written against. Five sectors rebased
 * against the market ARE peers: one hue for all of them, separated only by
 * dash, is unreadable at exactly the moment a chart carries the most. So
 * peers take the categorical order whether or not they are strokes, and keep
 * a solid line so the hue is what the reader compares.
 */

import type { ChartSeries, ChartSpec } from "../types/pipelines.types";

export type XKind = "date" | "number" | "category";

/** The validated categorical order for a chart's own (non-benchmark) series.
 *
 * Five, not three: a cross-sectional Section advances five sectors and draws
 * every one of them. The two added are the remaining validated steps already
 * defined in `globals.css`, in both themes.
 */
export const SELF_HUE_VARS = [
  "--chart-1",
  "--chart-2",
  "--chart-4",
  "--chart-3",
  "--chart-5",
] as const;

export const BENCHMARK_HUE_VAR = "--chart-benchmark";

/** Dash patterns for stroke charts, by position within the chart. */
const DASHES: (string | undefined)[] = [undefined, "6 4", "2 4", "8 3 2 3"];

export interface PreparedSeries {
  /** Row key in the prepared dataset. */
  key: string;
  name: string;
  role: "self" | "peer" | "benchmark";
  /** CSS custom property holding this series' colour. */
  colorVar: string;
  /** SVG dash array, or undefined for a solid stroke. */
  dash?: string;
}

export interface PreparedChart {
  xKind: XKind;
  /** One row per distinct x, ascending; holes left as null. */
  data: Record<string, number | string | null>[];
  series: PreparedSeries[];
  /** True when every series holds exactly one point — a scatter of positions. */
  isSinglePoint: boolean;
  /**
   * Explicit tick positions for an ordered axis. Recharts' own tick placement
   * plus a month-level label puts the same "Sep 25" twice at the left of a
   * weekly series; picking ticks from the data spaces them far enough apart
   * that the labels stay distinct.
   */
  xTicks?: number[];
}

const TARGET_TICKS = 6;

function pickTicks(values: number[]): number[] | undefined {
  if (values.length <= TARGET_TICKS) return undefined;
  const last = values.length - 1;
  const ticks: number[] = [];
  for (let i = 0; i < TARGET_TICKS; i += 1) {
    ticks.push(values[Math.round((i * last) / (TARGET_TICKS - 1))]);
  }
  return Array.from(new Set(ticks));
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

function isDateLike(value: unknown): boolean {
  return typeof value === "string" && ISO_DATE.test(value);
}

function classifyX(series: ChartSeries[]): XKind {
  const xs = series.flatMap((s) => (s.points ?? []).map((p) => p?.[0]));
  const present = xs.filter((x) => x !== null && x !== undefined);
  if (!present.length) return "category";
  if (present.every(isDateLike)) return "date";
  if (present.every((x) => typeof x === "number")) return "number";
  return "category";
}

function xToKey(x: unknown, kind: XKind): number | string | null {
  if (x === null || x === undefined) return null;
  if (kind === "date") {
    const ms = Date.parse(String(x));
    return Number.isNaN(ms) ? String(x) : ms;
  }
  if (kind === "number") return typeof x === "number" ? x : Number(x);
  return String(x);
}

function toNumber(y: unknown): number | null {
  if (y === null || y === undefined) return null;
  const n = typeof y === "number" ? y : Number(y);
  return Number.isFinite(n) ? n : null;
}

/** Whether a chart's identity is carried by stroke (and so can use dashes). */
export function isStrokeChart(kind: string): boolean {
  return kind === "line" || kind === "area";
}

export function prepareChart(spec: ChartSpec): PreparedChart {
  const rawSeries = spec.series ?? [];
  const xKind = classifyX(rawSeries);
  const strokeChart = isStrokeChart(spec.kind);

  let selfIndex = 0;
  let peerIndex = 0;
  const series: PreparedSeries[] = rawSeries.map((s, index) => {
    // An unknown role reads as `self`, which is what every series was before
    // `peer` existed — the role is additive, never a breaking change.
    const role: PreparedSeries["role"] =
      s.role === "benchmark"
        ? "benchmark"
        : s.role === "peer"
          ? "peer"
          : "self";
    let colorVar: string;
    if (role === "benchmark") {
      colorVar = BENCHMARK_HUE_VAR;
    } else if (role === "peer") {
      colorVar = SELF_HUE_VARS[Math.min(peerIndex, SELF_HUE_VARS.length - 1)];
      peerIndex += 1;
    } else {
      // Strokes hold one hue for the subject and let dash separate them;
      // marks, which have no stroke to dash, step through the categorical
      // order. A chart is one kind or the other, so the counter is only read
      // on the branch that indexes with it.
      colorVar = strokeChart
        ? SELF_HUE_VARS[0]
        : SELF_HUE_VARS[Math.min(selfIndex, SELF_HUE_VARS.length - 1)];
      selfIndex += 1;
    }
    return {
      key: `s${index}`,
      name: s.name,
      role,
      colorVar,
      // Peers are told apart by hue, so a dash would only muddy the one thing
      // the reader is comparing.
      dash:
        strokeChart && role !== "peer"
          ? DASHES[Math.min(index, DASHES.length - 1)]
          : undefined,
    };
  });

  // Union the independent grids, first-appearance order preserved for
  // categories and sorted for the two ordered kinds.
  const rows = new Map<string, Record<string, number | string | null>>();
  rawSeries.forEach((s, index) => {
    for (const point of s.points ?? []) {
      const x = xToKey(point?.[0], xKind);
      if (x === null) continue;
      const rowKey = String(x);
      const row = rows.get(rowKey) ?? { x };
      row[`s${index}`] = toNumber(point?.[1]);
      rows.set(rowKey, row);
    }
  });

  const data = Array.from(rows.values());
  if (xKind !== "category") {
    data.sort((a, b) => Number(a.x) - Number(b.x));
  }
  // Every series gets an explicit null where it has no reading, so a line
  // breaks its stroke instead of joining across the hole.
  for (const row of data) {
    for (const s of series) {
      if (!(s.key in row)) row[s.key] = null;
    }
    // A bar is categorical whatever its x holds — a strike or a session is a
    // slot, not a position on a continuum — so every row also carries its
    // rendered label, sorted by the underlying value above. Dates go to day
    // level here: a daily volume chart labelled by month would repeat one
    // label across thirty bars.
    row.xLabel = xKind === "date" ? formatXDay(row.x) : formatX(row.x, xKind);
  }

  return {
    xKind,
    data,
    series,
    isSinglePoint:
      rawSeries.length > 0 &&
      rawSeries.every((s) => (s.points ?? []).length === 1),
    xTicks:
      xKind === "category"
        ? undefined
        : pickTicks(data.map((row) => Number(row.x))),
  };
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Axis tick text for a prepared x value. */
export function formatX(value: unknown, kind: XKind): string {
  if (value === null || value === undefined) return "";
  if (kind === "date") {
    const d = new Date(Number(value));
    if (Number.isNaN(d.getTime())) return String(value);
    return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
  }
  if (kind === "number") return formatNumber(Number(value));
  return String(value);
}

/** Day-level date label ("12 Aug") for categorical axes and dense series. */
export function formatXDay(value: unknown): string {
  const d = new Date(Number(value));
  if (Number.isNaN(d.getTime())) return String(value ?? "");
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** Full x label for a tooltip, where there is room for the day. */
export function formatXLong(value: unknown, kind: XKind): string {
  if (kind !== "date") return formatX(value, kind);
  const d = new Date(Number(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Compact, locale-free number for an axis or a tooltip. */
export function formatNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${(value / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${(value / 1e5).toFixed(2)}L`;
  if (abs >= 1000)
    return value.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    });
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}
