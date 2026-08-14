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

import type { PipelineSummaryCard } from "../types/pipelines.types";

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
