/**
 * Indian-finance number formatting — the single source of truth for currency
 * and large-number display across every import-data preview/analytics surface.
 *
 * Replaces the per-component formatters that used to live in
 * HoldingsSummaryCard, transaction-analytics, and the two recharts files.
 */

const EM_DASH = "—";

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(num) ? num : null;
}

/**
 * Full INR amount with Indian digit grouping (lakh/crore commas), e.g.
 * `₹1,23,45,678`. Returns an em-dash for nullish/NaN input.
 */
export function formatINR(
  value: number | string | null | undefined,
  opts: { maxDecimals?: number; minDecimals?: number } = {},
): string {
  const num = toNumber(value);
  if (num === null) return EM_DASH;
  const { maxDecimals = 0, minDecimals } = opts;
  // Intl requires min <= max; lift max to min so callers passing only minDecimals
  // (relying on the default max of 0) don't trigger a RangeError.
  const effectiveMax =
    minDecimals !== undefined
      ? Math.max(maxDecimals, minDecimals)
      : maxDecimals;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: effectiveMax,
    ...(minDecimals !== undefined
      ? { minimumFractionDigits: minDecimals }
      : {}),
  }).format(num);
}

/**
 * Compact INR for tiles, axes, and tight chips — collapses to the Indian
 * crore/lakh/thousand scale, e.g. `₹1.23 Cr`, `₹4.5 L`, `₹9.2K`, `₹740`.
 * Sign is preserved so cash-flow figures read correctly.
 */
export function formatINRCompact(
  value: number | string | null | undefined,
  opts: { decimals?: number } = {},
): string {
  const num = toNumber(value);
  if (num === null) return EM_DASH;
  const { decimals = 1 } = opts;
  const sign = num < 0 ? "-" : "";
  const abs = Math.abs(num);

  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(decimals)} Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(decimals)} L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(decimals)}K`;
  // Drop the sign when the magnitude rounds to zero, so −0.4 reads "₹0", not "-₹0".
  const whole = abs.toFixed(0);
  return `${whole === "0" ? "" : sign}₹${whole}`;
}

/**
 * Plain integer with Indian grouping (no currency symbol) — for counts like
 * "1,240 transactions".
 */
export function formatCount(value: number | string | null | undefined): string {
  const num = toNumber(value);
  if (num === null) return EM_DASH;
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    num,
  );
}
