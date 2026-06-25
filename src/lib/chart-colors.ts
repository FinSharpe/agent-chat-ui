/**
 * Token-backed data-viz palette. These are CSS `var(--chart-*)` strings (defined
 * in globals.css for both light and dark), so recharts `fill`/`stroke` and
 * inline `backgroundColor` styles automatically follow the active theme instead
 * of being frozen to a hard-coded hex.
 */

/** Categorical series — cycle through these for pie/bar slices. */
export const CHART_SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
] as const;

/** Semantic gains / losses (money in vs money out, long vs short). */
export const CHART_POSITIVE = "var(--chart-positive)";
export const CHART_NEGATIVE = "var(--chart-negative)";

/** Pick a series colour by index, wrapping around the palette. */
export function chartSeriesColor(index: number): string {
  return CHART_SERIES[index % CHART_SERIES.length];
}
