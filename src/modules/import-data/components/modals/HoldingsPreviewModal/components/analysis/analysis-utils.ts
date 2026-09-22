import { PortfolioMetric } from "@/modules/core/portfolio/constants/portfolio-metrics";
import { getStatValue } from "@/modules/core/portfolio/utils/get-stat-value";

type Stats = Array<{ [key: string]: unknown }> | undefined;
type ScoreData = { label: string; value: number }[] | undefined;
type DistributionItem = { name: string; value: number };

/** The gauge's figure (first item) of a score chart payload, or null. */
export function scoreValue(data: ScoreData): number | null {
  const v = data?.[0]?.value;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** A portfolio stat as a number, or null when absent / not numeric. */
export function statNumber(
  stats: Stats,
  metric: PortfolioMetric,
): number | null {
  const raw = getStatValue(stats, metric);
  const n = typeof raw === "string" ? parseFloat(raw) : raw;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/** Tailwind classes for a score bar / ring: higher is better. */
export function scoreTone(v: number | null) {
  if (v === null) return { bar: "bg-slate-300", text: "text-slate-400" };
  if (v > 60) return { bar: "bg-[#0A9E6E]", text: "text-[#0A9E6E]" };
  if (v >= 30) return { bar: "bg-amber-500", text: "text-amber-600" };
  return { bar: "bg-rose-500", text: "text-rose-500" };
}

/** Risk is the other way round: lower is safer. */
export function riskTone(v: number | null) {
  if (v === null) return { bar: "bg-slate-300", text: "text-slate-400" };
  if (v < 30) return { bar: "bg-[#0A9E6E]", text: "text-[#0A9E6E]" };
  if (v <= 60) return { bar: "bg-amber-500", text: "text-amber-600" };
  return { bar: "bg-rose-500", text: "text-rose-500" };
}

export function riskLabel(v: number | null): string {
  if (v === null) return "—";
  return v < 30 ? "Low" : v <= 60 ? "Moderate" : "High";
}

/** Largest slice of a distribution (by absolute weight), or null. */
export function topSlice(items: DistributionItem[] | undefined) {
  const sorted = [...(items ?? [])].sort(
    (a, b) => Math.abs(b.value) - Math.abs(a.value),
  );
  return sorted[0] ?? null;
}

/**
 * Weight of the top `n` holdings from the analytics' holdings rows (which
 * carry a `weight` percentage), or null when weights aren't provided.
 */
export function topNWeight(
  holdings: Array<{ [key: string]: unknown }> | undefined,
  n: number,
): number | null {
  const weights = (holdings ?? [])
    .map((h) => Number(h.weight))
    .filter((w) => Number.isFinite(w) && w > 0)
    .sort((a, b) => b - a);
  if (weights.length === 0) return null;
  return weights.slice(0, n).reduce((s, w) => s + w, 0);
}

/** Holding with the largest weight, labelled by ticker / name. */
export function topHolding(
  holdings: Array<{ [key: string]: unknown }> | undefined,
  nameKeys: string[],
) {
  let best: { name: string; weight: number } | null = null;
  for (const h of holdings ?? []) {
    const w = Number(h.weight);
    if (!Number.isFinite(w)) continue;
    if (!best || w > best.weight) {
      const name = nameKeys
        .map((k) => h[k])
        .find((v) => typeof v === "string" && v) as string | undefined;
      best = { name: name ?? "Top holding", weight: w };
    }
  }
  return best;
}

/** Title-case a SEBI category / label for display ("Equity: Mid Cap" → "Mid Cap"). */
export function shortCategory(name: string): string {
  const parts = name.split(":");
  return (parts[1] ?? parts[0]).trim();
}
