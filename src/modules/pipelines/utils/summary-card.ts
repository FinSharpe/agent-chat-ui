/**
 * Reading a Summary Card off a chat message.
 *
 * `pipelines/delivery.py` writes the card into the thread as an assistant
 * message whose text is a plain-language fallback and whose
 * `additional_kwargs.pipeline_summary_card` carries the structure. The text is
 * what a renderer that knows nothing about pipelines shows; this is how the
 * one that does finds the card instead.
 *
 * The message arrives as loose JSON from the LangGraph SDK, so nothing here
 * trusts a field to exist — a half-shaped card renders as much as it has and
 * never throws inside the message list.
 */

import {
  LEGACY_DEGRADED_NOTICE,
  SECTION_ABSENCE_COPY,
  SECTION_ABSENCE_NOTICE,
} from "../constants/presentation";
import type {
  PipelineSummaryCard,
  PipelineSummaryCardSection,
} from "../types/pipelines.types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function readSummaryCard(message: unknown): PipelineSummaryCard | null {
  const record = asRecord(message);
  if (!record) return null;
  const kwargs = asRecord(record.additional_kwargs);
  const raw = asRecord(kwargs?.pipeline_summary_card);
  if (!raw) return null;

  const runId = typeof raw.run_id === "string" ? raw.run_id : "";
  if (!runId) return null;

  const stance = asRecord(raw.stance);
  const headlines = asRecord(raw.headlines) ?? {};

  return {
    run_id: runId,
    pipeline_id: typeof raw.pipeline_id === "string" ? raw.pipeline_id : "",
    target: (asRecord(raw.target) ?? {}) as PipelineSummaryCard["target"],
    stance: {
      value: typeof stance?.value === "string" ? stance.value : "",
      label: typeof stance?.label === "string" ? stance.label : "",
    },
    degraded: raw.degraded === true,
    coverage_gaps: Array.isArray(raw.coverage_gaps)
      ? raw.coverage_gaps.filter(
          (gap): gap is string => typeof gap === "string",
        )
      : [],
    sections: Array.isArray(raw.sections)
      ? raw.sections.flatMap((entry) => {
          const section = asRecord(entry);
          const stepId =
            typeof section?.step_id === "string" ? section.step_id : "";
          if (!stepId) return [];
          return [
            {
              step_id: stepId,
              title: typeof section?.title === "string" ? section.title : "",
              status: typeof section?.status === "string" ? section.status : "",
              headline:
                typeof section?.headline === "string" ? section.headline : "",
            },
          ];
        })
      : [],
    headlines: Object.fromEntries(
      Object.entries(headlines).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    ),
    published_at:
      typeof raw.published_at === "string" ? raw.published_at : null,
    report_path: typeof raw.report_path === "string" ? raw.report_path : "",
  };
}

/**
 * The card's running order: one row per Section, absences kept in place.
 *
 * A Section that produced nothing is a row here rather than an omission —
 * dropping it is what made a Run of a part-built Pipeline read as one that
 * fully succeeded. A row with neither a headline nor a known absence has
 * nothing to say and is left out, which is what the card did with an empty
 * headline before.
 *
 * A card delivered before the server carried its Sections falls back to
 * `headlines`, so an old card in a thread renders exactly what it always did.
 */
export function summaryCardRows(
  card: PipelineSummaryCard,
): PipelineSummaryCardSection[] {
  const sections = card.sections ?? [];
  if (sections.length > 0) {
    return sections.filter(
      (section) => !!section.headline || !!SECTION_ABSENCE_COPY[section.status],
    );
  }
  return Object.entries(card.headlines ?? {})
    .filter(([, headline]) => !!headline)
    .map(([step_id, headline]) => ({
      step_id,
      title: "",
      status: "succeeded",
      headline,
    }));
}

/**
 * The card's run-level notice, split by what it is a notice *of*.
 *
 * `degraded` and `coverage_gaps` share the warning strip they always have:
 * one is the Run falling short, the other a limit on this target that was
 * disclosed on the quote. A Section nobody has built yet is neither — it sets
 * neither flag by design (ADR-0013) and is a fact about the report rather
 * than about the reader's request — so it gets its own quiet line instead of
 * being folded into a warning it does not belong in.
 */
export function summaryCardNotices(card: PipelineSummaryCard): {
  warnings: string[];
  unbuilt: string | null;
} {
  const sections = card.sections ?? [];
  if (sections.length === 0) {
    // No per-section status to count: an older card has the run-level flags
    // and nothing else, and reads as it was written.
    const warnings: string[] = [];
    if (card.degraded) warnings.push(LEGACY_DEGRADED_NOTICE);
    if (card.coverage_gaps.length > 0) {
      warnings.push(
        SECTION_ABSENCE_NOTICE.coverage_gap(card.coverage_gaps.length),
      );
    }
    return { warnings, unbuilt: null };
  }

  const count = (status: string) =>
    sections.filter((section) => section.status === status).length;
  const failed = count("failed");
  const gaps = count("coverage_gap");
  const notWired = count("not_wired");

  const warnings: string[] = [];
  if (failed > 0) warnings.push(SECTION_ABSENCE_NOTICE.failed(failed));
  else if (card.degraded) warnings.push(LEGACY_DEGRADED_NOTICE);
  if (gaps > 0) warnings.push(SECTION_ABSENCE_NOTICE.coverage_gap(gaps));

  return {
    warnings,
    unbuilt: notWired > 0 ? SECTION_ABSENCE_NOTICE.not_wired(notWired) : null,
  };
}
