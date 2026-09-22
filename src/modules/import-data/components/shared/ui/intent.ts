/**
 * Intent → class maps shared by the import-data surfaces, in the reference
 * design's palette: brand blue #063BAA for accents, mint/green #0A9E6E only
 * for positive, amber and rose only for warning and danger. The literal
 * classes are the ones the design system remaps for dark mode, so light/dark
 * parity comes for free.
 */

export type SurfaceIntent =
  | "neutral"
  | "brand"
  | "positive"
  | "negative"
  | "info"
  | "warning";

/** Tinted icon-chip background + foreground for an intent. */
export const INTENT_CHIP: Record<SurfaceIntent, string> = {
  neutral: "bg-slate-100 text-slate-400",
  brand: "bg-[#063BAA]/8 text-[#063BAA]",
  positive: "bg-[#97edcc]/30 text-[#0A9E6E]",
  negative: "bg-rose-50 text-rose-500 dark:bg-rose-500/10",
  info: "bg-[#063BAA]/8 text-[#063BAA]",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
};

/** Value/figure text colour for an intent — semantic colour only where it
 * carries meaning (money in/out, a warning), neutral ink otherwise. */
export const INTENT_VALUE: Record<SurfaceIntent, string> = {
  neutral: "text-forest-deep dark:text-white",
  brand: "text-[#063BAA] dark:text-[#8FB4FF]",
  positive: "text-[#0A9E6E]",
  negative: "text-rose-500",
  info: "text-forest-deep dark:text-white",
  warning: "text-amber-600",
};
