/** Formatting shared by the Discover catalog and strategy detail. */

export const toNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** "+26.3%" (signed) or "14.8%" (unsigned); "--" when missing. */
export const formatPct = (v: unknown, { signed = true, digits = 1 } = {}) => {
  const n = toNumber(v);
  if (n === null) return "--";
  const sign = signed && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
};

export const formatRatio = (v: unknown) => {
  const n = toNumber(v);
  return n === null ? "--" : n.toFixed(2);
};

/** Pill colours for a strategy's risk level (reference palette; the pastel
 *  fills get a translucent dark-mode twin so they don't glare on dark cards). */
export const riskColor = (r?: string) => {
  switch (r?.toLowerCase()) {
    case "low":
      return "bg-[#97edcc]/25 text-[#0A9E6E]";
    case "medium":
    case "moderate":
      return "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400";
    case "high":
      return "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400";
    case "very high":
      return "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400";
    default:
      return "bg-slate-100 text-slate-500";
  }
};

/** Green for gains, rose for losses — by the formatted sign. */
export const signTone = (value: string) =>
  value.trim().startsWith("-") ? "text-rose-500" : "text-[#0A9E6E]";
