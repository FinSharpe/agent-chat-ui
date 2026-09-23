"use client";

import { cn } from "@/lib/utils";
import {
  SECTION_ABSENCE_CHIP,
  SECTION_ABSENCE_COPY,
} from "../../constants/presentation";
import { presentMetrics } from "../../constants/metric-dictionary";
import type { ReportSection } from "../../types/pipelines.types";
import { sectionAnchorId } from "../../utils/report";
import { ReportChart } from "../charts/ReportChart";
import { Chip, type ChipTone } from "../shared/kit";
import { ReportTableView } from "./ReportTableView";

const BADGE_TONE: Record<string, ChipTone> = {
  positive: "mint",
  caution: "amber",
  neutral: "blue",
};

/**
 * A section's scalar figures as the reference lists key metrics: label left,
 * value right, hairlines between — two columns where the width allows.
 */
function MetricRows({ metrics }: { metrics: Record<string, unknown> }) {
  const tiles = presentMetrics(metrics);
  if (!tiles.length) return null;
  return (
    <dl className="grid gap-x-6 border-b border-slate-100 sm:grid-cols-2 dark:border-slate-800/60">
      {tiles.map((tile) => (
        <div
          key={tile.key}
          className="flex items-center justify-between gap-4 border-t border-slate-100 py-2.5 dark:border-slate-800/60"
        >
          <dt className="text-[11px] text-slate-500 dark:text-slate-400">
            {tile.label}
          </dt>
          <dd
            className={cn(
              "text-right text-[11px] font-medium tabular-nums",
              tile.toneSign === null || tile.toneSign === 0
                ? "text-[#0A1F4D] dark:text-white"
                : tile.toneSign > 0
                  ? "text-[#0A9E6E]"
                  : "text-rose-500",
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
 * One Section of the frozen report, as a card in the report's column.
 *
 * A Section that produced nothing keeps its place with a dashed placeholder
 * rather than being dropped: a reader has to be able to tell "we looked and
 * there is nothing" from "we never looked", and both from a section that
 * simply is not in this report.
 */
export function ReportSectionView({ section }: { section: ReportSection }) {
  const anchorId = sectionAnchorId(section.step_id);
  const output = section.output;

  if (section.status !== "succeeded" || !output) {
    const absent = SECTION_ABSENCE_COPY[section.status];
    return (
      <section
        id={anchorId}
        className="rounded-card scroll-mt-4 border border-dashed border-slate-200 p-4.5 dark:border-slate-700"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-geist text-[13px] font-medium text-slate-500 dark:text-slate-400">
            {section.title}
          </h3>
          <Chip tone="slate">
            {SECTION_ABSENCE_CHIP[section.status] ?? "not produced"}
          </Chip>
        </div>
        <p className="mt-1.5 text-[11px] font-medium text-[#0A1F4D] dark:text-white">
          {absent?.title ?? "Not produced"}
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
          {absent?.body ??
            "This section is not part of this report. Nothing here was estimated."}
        </p>
      </section>
    );
  }

  const badge = output.badge;

  return (
    <section
      id={anchorId}
      className="glass-card rounded-card scroll-mt-4 space-y-4 p-4.5"
    >
      {/* The badge wraps under the title rather than squeezing it: a
          ranking's badge ("15 shortlisted from 146 screened") is long. */}
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-[12rem] flex-1 space-y-1">
          <h3 className="font-geist text-[13px] leading-snug font-medium text-[#0A1F4D] dark:text-white">
            {section.title}
          </h3>
          {output.headline && (
            <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
              {output.headline}
            </p>
          )}
        </div>
        {badge && (
          <Chip
            tone={BADGE_TONE[badge.value] ?? "blue"}
            className="shrink-0 px-2.5 py-1 text-[10px] tracking-normal normal-case"
          >
            {badge.label}
          </Chip>
        )}
      </div>

      {output.paragraph && (
        <p className="text-[11.5px] leading-relaxed text-[#0A1F4D]/85 dark:text-slate-300">
          {output.paragraph}
        </p>
      )}

      {output.metrics && Object.keys(output.metrics).length > 0 && (
        <MetricRows metrics={output.metrics} />
      )}

      {(output.charts?.length ?? 0) > 0 && (
        <div className="space-y-3">
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
        <div className="space-y-3">
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
