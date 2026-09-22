import { convertToMarkdownTable } from "@/lib/convertToMarkdownTable";
import { PortfolioMetric } from "@/modules/core/portfolio/constants/portfolio-metrics";
import { getStatValue } from "@/modules/core/portfolio/utils/get-stat-value";

type StatRow = { [key: string]: unknown };

/** A stat as a number, or null when the backend did not report it. */
export function statNumber(
  stats: StatRow[] | undefined,
  metric: PortfolioMetric,
): number | null {
  const value = getStatValue(stats, metric);
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** "24.81%" / "+24.81%" / "—". */
export function pct(value: number | null, signed = false): string {
  if (value === null) return "—";
  const sign = signed && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function num(value: number | null): string {
  return value === null ? "—" : value.toFixed(2);
}

export function rupees(value: unknown): string {
  const n = Number(value);
  if (value === null || value === undefined || !Number.isFinite(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: n < 100 ? 2 : 0 })}`;
}

/**
 * Every statistic the analytics returned, as label/value rows: the basket's
 * own figure first, then the benchmark's where one is reported. Percent
 * metrics carry their unit in the label ("CAGR (%)"), which moves onto the
 * value here.
 */
export function statRows(stats: StatRow[] | undefined) {
  if (!stats?.length) return { rows: [], columns: [] as string[] };
  const benchmark = Object.keys(stats[0]).find(
    (key) => key !== "Stats" && key !== "PORTFOLIO",
  );
  const format = (raw: unknown, isPct: boolean) => {
    if (raw === null || raw === undefined || raw === "") return "—";
    const n = Number(raw);
    if (!Number.isFinite(n)) return String(raw);
    return isPct ? `${n.toFixed(2)}%` : n.toFixed(2);
  };
  const rows = stats.map((stat) => {
    const label = String(stat.Stats ?? "");
    const isPct = label.includes("(%)");
    const values = [format(stat.PORTFOLIO, isPct)];
    if (benchmark) values.push(format(stat[benchmark], isPct));
    return { label: label.replace(" (%)", ""), values };
  });
  return {
    rows,
    columns: benchmark ? ["Basket", benchmark] : ["Basket"],
  };
}

/**
 * The first chat message for a basket: an intro, then its holdings as a
 * table — the same message the old "Add to chat" import posted, now used to
 * open a fresh chat the way the reference's buttons do.
 */
export function basketChatMessage(
  intro: string,
  rows: Record<string, string>[],
): string {
  return `${intro}

**Portfolio Holdings:**

${convertToMarkdownTable(rows)}
`;
}
