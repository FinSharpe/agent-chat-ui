/**
 * Indian digit grouping, ported from finsharpe-mobile
 * `lib/features/portfolio/data/portfolio_models.dart` so the same issue shows
 * the same minimum application on both apps.
 */

/** `1343248` → `13,43,248`. */
export function formatIndianInt(value: number): string {
  const negative = value < 0;
  let digits = String(Math.round(Math.abs(value)));
  if (digits.length > 3) {
    const last3 = digits.slice(-3);
    let rest = digits.slice(0, -3);
    const groups: string[] = [];
    while (rest.length > 2) {
      groups.unshift(rest.slice(-2));
      rest = rest.slice(0, -2);
    }
    if (rest) groups.unshift(rest);
    digits = `${groups.join(",")},${last3}`;
  }
  return negative ? `-${digits}` : digits;
}

/** `1343248` → `₹13,43,248`. */
export const formatInr = (value: number) => `₹${formatIndianInt(value)}`;

/** `35.9` → `35.9x`; a missing multiple is an em dash, never a blank tile. */
export const multipleLabel = (value: number | null | undefined) =>
  value == null ? "—" : `${value.toFixed(1)}x`;

/** `23.37` → `23.4%`. */
export const pctLabel = (value: number | null | undefined) =>
  value == null ? "—" : `${value.toFixed(1)}%`;

/** `23.37` → `+23.4%`. For growth, where the sign is the whole point. */
export const signedPctLabel = (value: number) =>
  `${value < 0 ? "" : "+"}${value.toFixed(1)}%`;

/** A Radar money figure as the panel's own unit prints it. */
export const crLabel = (value: number | null | undefined) =>
  value == null ? "—" : value.toFixed(2);
