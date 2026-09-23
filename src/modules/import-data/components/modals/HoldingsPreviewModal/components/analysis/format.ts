import type { ComparisonMetric } from "@/modules/import-data/types/holdings-analysis";

/** "12 Sep" from an ISO date; the raw string when it will not parse. */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** "Sep 2026" from a disclosure month ("2026-09" or a full date). */
export function monthLabel(month: string | null | undefined): string | null {
  if (!month) return null;
  const d = new Date(month.length === 7 ? `${month}-01` : month);
  if (Number.isNaN(d.getTime())) return month;
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

/** A comparison metric's value in its own unit. */
export function metricValue(
  value: number | null | undefined,
  unit: ComparisonMetric["unit"],
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (unit === "pct") return `${value.toFixed(1)}%`;
  if (unit === "x") return `${value.toFixed(1)}x`;
  return value.toFixed(0);
}

/** Coverage as a short share: "83" / "99.4". */
export function coverageLabel(pct: number): string {
  return pct >= 10 ? pct.toFixed(0) : pct.toFixed(1);
}

/** Signed percentage with two decimals, for one-session moves. */
export function signedPct(pct: number): string {
  return `${pct > 0 ? "+" : ""}${pct.toFixed(2)}%`;
}
