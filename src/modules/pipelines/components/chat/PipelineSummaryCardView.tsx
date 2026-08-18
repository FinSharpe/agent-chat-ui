"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, FileSearch } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTimestamp, stanceTone } from "../../constants/presentation";
import { researchRoutes } from "../../constants/routes";
import type { PipelineSummaryCard } from "../../types/pipelines.types";
import { targetLabel } from "../../utils/target";

/**
 * The Summary Card, as it lands in a chat thread at publish.
 *
 * It is a notice, not the report: the verdict, one line per section, and the
 * way in. Everything on it comes from the frozen document, so what the card
 * says and what the report says cannot diverge.
 */
export function PipelineSummaryCardView({
  card,
}: {
  card: PipelineSummaryCard;
}) {
  // A market Report has no ticker; the slot names the market instead of
  // rendering as a gap.
  const about = targetLabel(card.target);
  const tone = stanceTone(card.stance?.value);
  const headlines = Object.entries(card.headlines ?? {}).filter(
    ([, headline]) => !!headline,
  );

  return (
    <div className="border-border-default bg-bg-card my-1 w-full max-w-xl overflow-hidden rounded-xl border">
      <div className="border-border-subtle flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="bg-info-icon-bg flex size-8 items-center justify-center rounded-lg">
            <FileSearch className="text-info-icon size-4" />
          </span>
          <div>
            <p className="text-text-primary text-sm font-medium">
              {about ? `${about} research report` : "Research report"}
            </p>
            <p className="text-text-tertiary text-xs">
              {card.published_at
                ? `Ready · ${formatTimestamp(card.published_at)}`
                : "Ready"}
            </p>
          </div>
        </div>
        {card.stance?.label && (
          <span
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium",
              tone.chip,
            )}
          >
            {card.stance.label}
          </span>
        )}
      </div>

      {headlines.length > 0 && (
        <ul className="space-y-1.5 px-4 py-3">
          {headlines.map(([stepId, headline]) => (
            <li
              key={stepId}
              className="text-text-secondary flex gap-2 text-sm"
            >
              <span
                aria-hidden="true"
                className="bg-text-muted mt-1.5 size-1 shrink-0 rounded-full"
              />
              {headline}
            </li>
          ))}
        </ul>
      )}

      {(card.degraded || card.coverage_gaps.length > 0) && (
        <p className="border-border-subtle bg-warning-bg text-warning-fg flex items-start gap-2 border-t px-4 py-2.5 text-xs">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {card.degraded
            ? "Some sections could not be produced — each is marked in the report."
            : `${card.coverage_gaps.length} ${card.coverage_gaps.length === 1 ? "section is" : "sections are"} not covered, and are marked in the report.`}
        </p>
      )}

      <div className="border-border-subtle flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5">
        <Link
          href={researchRoutes.report(card.run_id)}
          className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Read the report
          <ArrowUpRight className="size-4" />
        </Link>
        <span className="text-text-muted font-mono text-[11px]">
          {card.run_id}
        </span>
      </div>
    </div>
  );
}
