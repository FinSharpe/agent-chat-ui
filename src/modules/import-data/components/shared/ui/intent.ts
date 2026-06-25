/**
 * Intent → token-class maps shared by the import-data preview surfaces.
 * Keeping these in one place is what makes a StatTile, a panel header chip, and
 * an empty-state icon read as the same design language. Token-only (no raw hex)
 * so light/dark parity comes for free.
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
  neutral: "bg-muted text-text-secondary",
  brand: "bg-secondary text-secondary-foreground",
  positive: "bg-success-bg text-success-fg",
  negative: "bg-error-bg text-error-fg",
  info: "bg-info-icon-bg text-info-icon",
  warning: "bg-warning-bg text-warning-fg",
};

/** Value/figure text colour for an intent — semantic colour only where it
 * carries meaning (money in/out), neutral primary otherwise. */
export const INTENT_VALUE: Record<SurfaceIntent, string> = {
  neutral: "text-text-primary",
  brand: "text-text-primary",
  positive: "text-success-fg",
  negative: "text-error-fg",
  info: "text-text-primary",
  warning: "text-warning-fg",
};
