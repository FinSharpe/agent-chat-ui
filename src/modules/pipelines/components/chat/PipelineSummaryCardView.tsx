"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CircleDashed,
  FileSearch,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SECTION_ABSENCE_COPY,
  formatTimestamp,
} from "../../constants/presentation";
import { researchRoutes } from "../../constants/routes";
import type { PipelineSummaryCard } from "../../types/pipelines.types";
import { summaryCardNotices, summaryCardRows } from "../../utils/summary-card";
import { targetLabel } from "../../utils/target";
import { Chip, type ChipTone } from "../shared/kit";

/** A verdict is never a green "buy" or a red "sell": constructive gets the
 *  brand mint, cautious the warning amber, anything else stays brand blue. */
const STANCE_CHIP: Record<string, ChipTone> = {
  constructive: "mint",
  cautious: "amber",
};

/**
 * The Summary Card, as it lands in a chat thread at publish — drawn as a
 * glass card in the same language as the Agent Workflows screens it links to.
 *
 * It is a notice, not the report: the verdict, one line per section, and the
 * way in. Everything on it comes from the frozen document, so what the card
 * says and what the report says cannot diverge.
 *
 * One line per section means *every* section. A Section that produced nothing
 * keeps its place with its absence named, the way `ReportSectionView` does —
 * a card that listed only the sections with a headline read as a Run that
 * fully succeeded, whatever the report went on to show.
 */
export function PipelineSummaryCardView({
  card,
}: {
  card: PipelineSummaryCard;
}) {
  // A market Report has no ticker; the slot names the market instead of
  // rendering as a gap.
  const about = targetLabel(card.target);
  const rows = summaryCardRows(card);
  const notices = summaryCardNotices(card);

  return (
    <div className="glass-card rounded-card font-funnel my-1 w-full max-w-xl overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4.5 py-3.5 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <span className="rounded-tile flex h-9 w-9 items-center justify-center bg-[#063BAA]/8 text-[#063BAA]">
            <FileSearch size={16} />
          </span>
          <div>
            <p className="font-geist text-[13px] font-medium text-[#0A1F4D] dark:text-white">
              {about ? `${about} research report` : "Research report"}
            </p>
            <p className="text-[10px] text-slate-400">
              {card.published_at
                ? `Ready · ${formatTimestamp(card.published_at)}`
                : "Ready"}
            </p>
          </div>
        </div>
        {card.stance?.label && (
          <Chip tone={STANCE_CHIP[card.stance.value] ?? "blue"}>
            {card.stance.label}
          </Chip>
        )}
      </div>

      {rows.length > 0 && (
        <ul className="space-y-1.5 px-4.5 py-3.5">
          {rows.map((row) => {
            // The report's own wording for this absence, not a second copy of
            // it: telling a reader their stock was out of coverage when
            // nobody had built the section yet would simply be untrue.
            const absent = SECTION_ABSENCE_COPY[row.status];
            return (
              <li
                key={row.step_id}
                className={cn(
                  "flex gap-2 text-[12px] leading-snug",
                  absent ? "text-slate-400" : "text-[#0A1F4D] dark:text-white",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-[7px] h-1 w-1 shrink-0 rounded-full",
                    absent ? "bg-slate-300" : "bg-[#0A9E6E]",
                  )}
                />
                {absent ? (
                  <span>
                    {row.title}
                    <span className="text-slate-400">
                      {row.title ? " — " : ""}
                      {absent.title}
                    </span>
                  </span>
                ) : (
                  row.headline
                )}
              </li>
            );
          })}
        </ul>
      )}

      {notices.warnings.length > 0 && (
        <div className="flex items-start gap-2 border-t border-slate-100 px-4.5 py-2.5 text-[11px] text-amber-600 dark:border-slate-800/60 dark:text-amber-400">
          <AlertTriangle
            size={13}
            className="mt-0.5 shrink-0"
          />
          <div className="space-y-1">
            {notices.warnings.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Its own quiet line rather than a third sentence in the warning strip
          above: a section nobody has built yet is not a degradation and not a
          coverage gap, and amber would read as one of the two. */}
      {notices.unbuilt && (
        <p className="flex items-start gap-2 border-t border-slate-100 px-4.5 py-2.5 text-[11px] text-slate-400 dark:border-slate-800/60">
          <CircleDashed
            size={13}
            className="mt-0.5 shrink-0"
          />
          {notices.unbuilt}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4.5 py-3 dark:border-slate-800/60">
        <Link
          href={researchRoutes.report(card.run_id)}
          className="bg-brand-gradient inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10.5px] font-medium tracking-wide text-white uppercase transition-all hover:brightness-110"
        >
          Read the report
          <ArrowUpRight size={12} />
        </Link>
        <span className="font-mono text-[10px] text-slate-400">
          {card.run_id}
        </span>
      </div>
    </div>
  );
}
