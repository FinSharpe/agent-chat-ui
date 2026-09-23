/**
 * Compact rupee figure in the reference's style — ₹18.7L, ₹1.25Cr, ₹46.8K.
 * Whole figures drop the decimal (₹5L, not ₹5.0L).
 */
export function formatINRShort(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value < 0 ? "−" : "";
  const n = Math.abs(value);
  const scaled = (div: number, digits: number, suffix: string) => {
    const v = n / div;
    const fixed = v.toFixed(digits);
    return `${sign}₹${Number(fixed) === Math.round(v) ? Math.round(v) : fixed}${suffix}`;
  };
  if (n >= 1e7) return scaled(1e7, 2, "Cr");
  if (n >= 1e5) return scaled(1e5, 1, "L");
  if (n >= 1e3) return scaled(1e3, 1, "K");
  return `${sign}₹${Math.round(n)}`;
}

/** Full rupee amount with Indian digit grouping — ₹5,00,000. */
export function formatINRFull(value: string | number | boolean | undefined): string {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  if (!Number.isFinite(n)) return "";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
