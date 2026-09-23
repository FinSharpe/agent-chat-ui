"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import SectionErrorState from "@/components/shared/SectionErrorState";
import { cn } from "@/lib/utils";
import { DataPanel } from "@/modules/import-data/components/shared/ui";
import {
  DatedHolding,
  ETF_NAME_FALLBACK,
  RebalanceEvent,
} from "../../types/strategy-api";
import { shortDate } from "../../utils/format";

/**
 * The full dated holdings history, grouped by rebalance date. Raw holdings —
 * no prices, no screener join — so it is cheap enough to fetch the first
 * time a row is opened.
 */
function useHoldingsHistory(strategy: string, enabled: boolean) {
  return useQuery({
    queryKey: ["strategy-holdings-history", strategy],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch(
        `/api/utilities/strategies/${encodeURIComponent(strategy)}/holdings`,
      );
      if (!res.ok) throw new Error(`holdings history ${res.status}`);
      const body = (await res.json()) as { holdings?: DatedHolding[] };
      const byDate = new Map<string, DatedHolding[]>();
      for (const h of body.holdings ?? []) {
        if (!h?.as_of_date || !h.symbol) continue;
        byDate.set(h.as_of_date, [...(byDate.get(h.as_of_date) ?? []), h]);
      }
      byDate.forEach((list) => list.sort((x, y) => y.weight - x.weight));
      return byDate;
    },
  });
}

function RebalanceHoldings({
  strategy,
  date,
}: {
  strategy: string;
  date: string;
}) {
  const query = useHoldingsHistory(strategy, true);
  if (query.isError) {
    return (
      <SectionErrorState
        compact
        title="Couldn't load the holdings for this rebalance"
        onRetry={() => query.refetch()}
      />
    );
  }
  if (!query.data) {
    return (
      <div className="space-y-1.5 py-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2.5 animate-pulse rounded bg-slate-100 dark:bg-slate-800"
          />
        ))}
      </div>
    );
  }
  const holdings = query.data.get(date) ?? [];
  if (holdings.length === 0) {
    return (
      <p className="text-[10px] text-slate-400">
        No holdings recorded for this date.
      </p>
    );
  }
  return (
    <div className="space-y-1">
      {holdings.map((h) => (
        <div
          key={h.symbol}
          className="flex items-center justify-between gap-3 text-[11px]"
        >
          <span className="text-forest-deep truncate dark:text-white">
            {h.asset_type === "MF"
              ? h.symbol
              : (ETF_NAME_FALLBACK[h.symbol] ?? h.symbol)}
          </span>
          {/* A 0–1 fraction on this endpoint. */}
          <span className="text-forest-deep shrink-0 tabular-nums dark:text-white">
            {(h.weight * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Every rebalance on record, newest first, with one-way turnover — each row
 * opens to the book as it stood on that date. Read straight from the dated
 * holdings history: the one part of the strategy's past we can state
 * exactly. After finsharpe-mobile's `RebalanceHistoryCard`.
 */
export function RebalanceHistory({
  events,
  strategy,
}: {
  events: RebalanceEvent[];
  strategy: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const ordered = [...events].reverse();

  return (
    <DataPanel
      title="Rebalance history"
      addon={String(events.length)}
    >
      <div className="divide-border-subtle -my-1 divide-y">
        {ordered.map((e, i) => {
          const isOpen = open === e.as_of_date;
          const changes = [
            `${e.holdings} holdings`,
            e.added ? `${e.added} added` : null,
            e.removed ? `${e.removed} removed` : null,
          ].filter(Boolean);
          return (
            <div key={e.as_of_date}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : e.as_of_date)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 py-2.5 text-left"
              >
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    // The newest rebalance is the live book.
                    i === 0
                      ? "bg-[#063BAA] dark:bg-[#8FB4FF]"
                      : "bg-slate-200 dark:bg-slate-700",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="text-forest-deep block text-[11px] font-medium dark:text-white">
                    {shortDate(e.as_of_date)}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {changes.join(" · ")}
                  </span>
                </span>
                {e.turnover_pct != null ? (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 tabular-nums dark:bg-slate-800 dark:text-slate-300">
                    {e.turnover_pct.toFixed(0)}% turnover
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] text-slate-400">
                    first on record
                  </span>
                )}
                <ChevronDown
                  size={14}
                  className={cn(
                    "shrink-0 text-slate-300 transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {isOpen && (
                <div className="pb-3 pl-5">
                  <RebalanceHoldings
                    strategy={strategy}
                    date={e.as_of_date}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] leading-relaxed text-slate-400">
        Open a rebalance to see the holdings it set. Turnover is one-way (half
        of the summed weight changes): replacing one 10% position with another
        counts as 10%. Only rebalances published to FinSharpe are listed, so the
        first one shown is not necessarily the strategy inception.
      </p>
      {events.length < 2 && (
        <p className="text-[10px] text-amber-600">
          Only one rebalance is on record, so no turnover can be measured.
        </p>
      )}
    </DataPanel>
  );
}
