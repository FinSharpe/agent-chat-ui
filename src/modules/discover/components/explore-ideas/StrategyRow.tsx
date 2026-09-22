"use client";

import { ArrowRight } from "lucide-react";
import { IdeaStrategy } from "../../types/discover.types";
import { riskColor, signTone } from "../../utils/format";

/**
 * One cardless row per strategy — the full picture (tags, metrics,
 * holdings) lives on the strategy detail this opens.
 */
export function StrategyRow({
  s,
  onClick,
}: {
  s: IdeaStrategy;
  onClick: () => void;
}) {
  const sub = s.summary ?? (s.tags.length ? s.tags.join(" · ") : undefined);
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4.5 py-3.5 text-left transition-colors active:bg-[#063BAA]/[0.03]"
    >
      <span className="min-w-0 flex-1">
        <span className="font-geist block truncate text-[13px] leading-snug font-medium text-[#0A1F4D] dark:text-white">
          {s.title}
        </span>
        {sub && (
          <span className="mt-0.5 block truncate text-[11px] leading-snug text-slate-500 dark:text-slate-400">
            {sub}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {s.return1Y ? (
          <span
            className={`text-[12px] font-medium tabular-nums ${signTone(s.return1Y)}`}
          >
            {s.return1Y}
          </span>
        ) : (
          s.launchStatus && (
            <span className="text-[10px] font-medium text-slate-400">
              {s.launchStatus}
            </span>
          )
        )}
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
