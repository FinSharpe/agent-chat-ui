import type { Citation } from "./types";

/** How a filing describes itself on screen. */

/**
 * `concall` → `Concall`, `investor-presentation` → `Investor presentation`.
 * An unknown value is title-cased rather than dropped: a new filing category
 * upstream should read a little plain here, never blank.
 */
export function filingTypeLabel(subcatname: string): string {
  const words = subcatname.trim().replace(/_/g, "-").split("-").filter(Boolean);
  if (words.length === 0) return "Filing";
  const joined = words.join(" ").toLowerCase();
  return joined[0].toUpperCase() + joined.slice(1);
}

/** "22 Apr 2026", or empty when the wire date is missing or unparseable. */
export function filingDateLabel(citation: Citation): string {
  if (!citation.newsDtIso) return "";
  const date = new Date(citation.newsDtIso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** What to call this filing's issuer: the company name, falling back to the ticker. */
export function citationDisplayName(citation: Citation): string {
  return citation.compname || citation.symbol || "Filing";
}

/**
 * "Concall · 22 Apr 2026 · Page 12" — every part optional, joined only when
 * present so a passage with no page never renders a dangling separator.
 */
export function citationMeta(
  citation: Citation,
  { withPage = true }: { withPage?: boolean } = {},
): string {
  return [
    filingTypeLabel(citation.subcatname),
    filingDateLabel(citation),
    withPage && citation.page != null ? `Page ${citation.page}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * The screen-reader announcement for a chip or a footer row: what the source
 * is, not merely that a citation exists.
 */
export function citationLabel(citation: Citation, number?: number): string {
  const prefix = number == null ? "Source" : `Citation ${number}`;
  return `${prefix}, ${citationDisplayName(citation)} — ${citationMeta(citation)}`;
}
