"use client";
import { useState } from "react";
import type {
  AnalysedHolding,
  Distribution,
  HoldingDayMove,
} from "@/modules/import-data/types/holdings-analysis";
import { cn } from "@/lib/utils";
import {
  BarRow,
  DataPanel,
  DonutBreakdown,
} from "@/modules/import-data/components/shared/ui";
import { signedPct } from "./format";

/** "Equity: Mid Cap" → "Mid Cap". */
const shortCategory = (name: string) => (name.split(":")[1] ?? name).trim();

/** Industry (equity) / category (MF) donuts and the market-cap bars. */
export function AllocationSections({
  industry,
  categories,
  size,
}: {
  industry: Distribution[];
  categories: Distribution[];
  size: Distribution[];
}) {
  return (
    <>
      {industry.length > 0 && (
        <DataPanel title="Industry allocation">
          <DonutBreakdown segments={industry} />
        </DataPanel>
      )}
      {categories.length > 0 && (
        <DataPanel title="Category allocation">
          <DonutBreakdown
            segments={categories.map((c) => ({
              name: shortCategory(c.name),
              value: c.value,
            }))}
          />
        </DataPanel>
      )}
      {size.length > 0 && (
        <DataPanel
          title="Market cap"
          bodyClassName="space-y-2 text-[10.5px]"
        >
          {size.map((s) => (
            <BarRow
              key={s.name}
              label={s.name}
              valueLabel={`${s.value.toFixed(1)}%`}
              pct={Math.abs(s.value)}
              barClass="bg-[#063BAA] dark:bg-[#8FB4FF]"
            />
          ))}
        </DataPanel>
      )}
    </>
  );
}

const scoreClass = (s: number) =>
  s >= 70 ? "text-[#0A9E6E]" : s >= 45 ? "text-slate-500" : "text-amber-600";

/**
 * The analysed holdings: name, a weight bar, the weight and today's move, plus
 * the FinSharpe / Performance score where the screener covers the holding.
 * Opens to the top five by weight and expands in place.
 */
export function AnalysedHoldingsCard({
  holdings,
  moves,
}: {
  holdings: AnalysedHolding[];
  moves: HoldingDayMove[];
}) {
  const [showAll, setShowAll] = useState(false);
  if (holdings.length === 0) return null;
  const sorted = [...holdings].sort((a, b) => b.weight - a.weight);
  const shown = showAll ? sorted : sorted.slice(0, 5);
  const heaviest = sorted[0]?.weight || 1;
  const dayOf = new Map(moves.map((m) => [m.ticker, m.day_pct]));

  return (
    <DataPanel
      title="Holdings"
      addon={`${holdings.length} total`}
    >
      <div className="divide-border-subtle -my-2 divide-y">
        {shown.map((h) => {
          const day = dayOf.get(h.id);
          return (
            <div
              key={h.id}
              className="flex items-center gap-3 py-2.5 text-[11px]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-forest-deep truncate font-medium dark:text-white">
                  {h.name}
                </p>
                <p className="truncate text-[9.5px] text-slate-400">{h.id}</p>
              </div>
              <div className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-[#063BAA] dark:bg-[#8FB4FF]"
                  style={{
                    width: `${Math.max(2, (h.weight / heaviest) * 100)}%`,
                  }}
                />
              </div>
              {h.score !== null && (
                <span
                  title="Score (0–100)"
                  className={cn(
                    "w-7 shrink-0 text-right font-semibold tabular-nums",
                    scoreClass(h.score),
                  )}
                >
                  {h.score.toFixed(0)}
                </span>
              )}
              <div className="w-14 shrink-0 text-right tabular-nums">
                <p className="text-forest-deep font-semibold dark:text-white">
                  {h.weight.toFixed(1)}%
                </p>
                {day !== undefined && (
                  <p
                    className={cn(
                      "text-[9.5px]",
                      day >= 0 ? "text-[#0A9E6E]" : "text-rose-500",
                    )}
                  >
                    {signedPct(day)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {holdings.length > 5 && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="hover-tint mt-3 w-full rounded-full border border-slate-200 py-2 text-[10.5px] font-medium text-slate-500 dark:border-slate-700 dark:text-slate-300"
        >
          Show all {holdings.length} holdings
        </button>
      )}
    </DataPanel>
  );
}
