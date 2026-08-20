"use client";

import { cn } from "@/lib/utils";
import { badgeTone, SECTION_ABSENCE_COPY } from "../../constants/presentation";
import { presentMetrics } from "../../constants/metric-dictionary";
import type { ReportSection } from "../../types/pipelines.types";
import { sectionAnchorId } from "../../utils/report";
import { ReportChart } from "../charts/ReportChart";
import { ReportTableView } from "./ReportTableView";

function MetricGrid({ metrics }: { metrics: Record<string, unknown> }) {
  const tiles = presentMetrics(metrics);
  if (!tiles.length) return null;
  return (
    // Individually bordered tiles rather than one grid over a rule-coloured
    // background: the column count is responsive, so the last row is usually
    // short and the leftover cells would show as blank grey blocks that read
    // like broken tiles.
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div
          key={tile.key}
          className="border-border-default bg-bg-card rounded-lg border px-4 py-3"
        >
          <dt className="text-text-tertiary text-xs">{tile.label}</dt>
          <dd
            className={cn(
              "mt-0.5 text-sm font-medium tabular-nums",
              tile.toneSign === null || tile.toneSign === 0
                ? "text-text-primary"
                : tile.toneSign > 0
                  ? "text-success-fg"
                  : "text-error-fg",
            )}
          >
            {tile.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * One Section of the frozen report.
 *
 * A Section that produced nothing keeps its place with a dashed placeholder
 * rather than being dropped: a reader has to be able to tell "we looked and
 * there is nothing" from "we never looked", and both from a section that
 * simply is not in this report.
 */
export function ReportSectionView({ section }: { section: ReportSection }) {
  const anchorId = sectionAnchorId(section.step_id);
  const output = section.output;
  const absent = SECTION_ABSENCE_COPY[section.status];

  if (section.status !== "succeeded" || !output) {
    return (
      <section
        id={anchorId}
        className="border-border-default bg-bg-subtle scroll-mt-6 rounded-xl border border-dashed px-6 py-5"
      >
        <h3 className="text-text-secondary text-base font-medium">
          {section.title}
        </h3>
        <p className="text-text-secondary mt-1 text-sm font-medium">
          {absent?.title ?? "Not produced"}
        </p>
        <p className="text-text-tertiary mt-1 max-w-2xl text-sm">
          {absent?.body ??
            "This section is not part of this report. Nothing here was estimated."}
        </p>
      </section>
    );
  }

  const badge = output.badge;
  const tone = badgeTone(badge?.value);

  return (
    <section
      id={anchorId}
      className="border-border-default bg-bg-card scroll-mt-6 rounded-xl border p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-text-primary text-base font-medium">
            {section.title}
          </h3>
          {output.headline && (
            <p className="text-text-secondary mt-1 text-sm">
              {output.headline}
            </p>
          )}
        </div>
        {badge && (
          <span
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium",
              tone.chip,
            )}
          >
            {badge.label}
          </span>
        )}
      </div>

      {output.paragraph && (
        <p className="text-text-primary mt-4 text-sm leading-relaxed">
          {output.paragraph}
        </p>
      )}

      {output.metrics && Object.keys(output.metrics).length > 0 && (
        <div className="mt-5">
          <MetricGrid metrics={output.metrics} />
        </div>
      )}

      {(output.charts?.length ?? 0) > 0 && (
        <div className="mt-5 space-y-4">
          {output.charts!.map((chart) => (
            <ReportChart
              key={chart.id}
              spec={chart}
            />
          ))}
        </div>
      )}

      {/* Rule-authored rows, last: a longitudinal Section carries none, so
          this block simply does not render for the Stock Deep Dive. */}
      {(output.tables?.length ?? 0) > 0 && (
        <div className="mt-5 space-y-4">
          {output.tables!.map((table) => (
            <ReportTableView
              key={table.id}
              table={table}
            />
          ))}
        </div>
      )}
    </section>
  );
}
