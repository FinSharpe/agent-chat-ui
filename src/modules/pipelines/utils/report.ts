/**
 * Reading the frozen document.
 *
 * One contract fact drives this whole file: `Stance.badges` is *positional* —
 * it carries only the badges of Sections that produced output, in order, with
 * no step ids attached. Zipping it against the section list would silently
 * mislabel every badge after the first coverage gap. `document.sections` is
 * the only source that keeps names, order, and the gap/failed states, so the
 * Stance header is built from there and the Stance itself contributes only its
 * verdict. (Recorded in the Phase 6 sign-off; `finsharpe-mobile` does the same.)
 */

import type {
  ReportDocument,
  ReportSection,
  SectionBadge,
} from "../types/pipelines.types";

export interface SectionSummary {
  stepId: string;
  title: string;
  /** succeeded | failed | coverage_gap */
  status: string;
  badge: SectionBadge | null;
  headline: string;
  anchorId: string;
}

export function sectionAnchorId(stepId: string): string {
  return `section-${stepId}`;
}

/** Every Section in running order, with the badge it actually carries. */
export function summariseSections(
  document: Pick<ReportDocument, "sections">,
): SectionSummary[] {
  return (document.sections ?? []).map((section: ReportSection) => ({
    stepId: section.step_id,
    title: section.title,
    status: section.status,
    badge: section.output?.badge ?? null,
    headline: section.output?.headline ?? "",
    anchorId: sectionAnchorId(section.step_id),
  }));
}

export function hasCharts(section: ReportSection): boolean {
  return (section.output?.charts?.length ?? 0) > 0;
}

/** The target symbol, or the empty string — the target is a loose dict. */
export function targetSymbol(target: unknown): string {
  if (target && typeof target === "object" && "symbol" in target) {
    return String((target as { symbol?: unknown }).symbol ?? "");
  }
  return "";
}

/**
 * Every source the Run probed, in a stable order, with the vintage it was
 * pinned to. All of them are listed, including any the report never drew from:
 * the vintage map is half the content key that decides whether a repurchase
 * reuses this document, so a reader comparing two runs should see all of it.
 *
 * The PDF additionally marks *which* Sections consumed each source. That needs
 * the registry's step→sources wiring, which the frozen document does not carry
 * and no endpoint exposes — so the web table lists the sources and their
 * vintages, and claims nothing it cannot know.
 */
export function vintageRows(
  vintageMap: Record<string, string> | undefined,
): { source: string; token: string }[] {
  if (!vintageMap) return [];
  return Object.entries(vintageMap)
    .map(([source, token]) => ({ source, token: String(token) }))
    .sort((a, b) => a.source.localeCompare(b.source));
}
