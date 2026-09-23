"use client";

import { ArrowRight } from "lucide-react";
import { IdeaStrategy } from "../../types/discover.types";
import { formatDayPct, riskColor, signTone } from "../../utils/format";

/**
 * One cardless row per strategy — the full picture (tags, metrics,
 * holdings) lives on the strategy detail this opens.
 *
 * The trailing figure is the day move and nothing else, labelled "today" so
 * it is never read as a track record: every trailing return the list serves
 * is a back-test of today's holdings (finsharpe-agents#92). An unpriced book
 * shows a dash rather than a 0% — unpriced and flat are different facts.
 */
export function StrategyRow({
  s,
  onClick,
}: {
  s: IdeaStrategy;
  onClick: () => void;
}) {
  const day = s.dayPct === undefined ? null : formatDayPct(s.dayPct);
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4.5 py-3.5 text-left transition-colors active:bg-[#063BAA]/[0.03]"
    >
      {/* The name owns its line and may wrap before it truncates; the day
          move sits under it (mobile's StrategyRow, #120). */}
      <span className="min-w-0 flex-1">
        <span className="font-geist line-clamp-2 block text-[13px] leading-snug font-medium text-[#0A1F4D] dark:text-white">
          {s.title}
        </span>
        <span className="mt-0.5 flex items-baseline gap-1 text-[12px]">
          <span
            className={`font-medium tabular-nums ${day ? signTone(day) : "text-slate-400"}`}
          >
            {day ?? "—"}
          </span>
          <span className="text-[10px] text-slate-400">today</span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {s.risk && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[8.5px] font-medium tracking-wider uppercase ${riskColor(s.risk)}`}
          >
            {s.risk}
          </span>
        )}
        <ArrowRight
          size={13}
          className="text-slate-300 dark:text-slate-600"
        />
      </span>
    </button>
  );
}
