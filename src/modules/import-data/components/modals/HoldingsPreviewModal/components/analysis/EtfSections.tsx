"use client";
import { useState } from "react";
import type {
  EtfLookThrough,
  EtfTypeBreakdown,
} from "@/modules/import-data/types/holdings-analysis";
import {
  DataPanel,
  DonutBreakdown,
  formatINRShort,
} from "@/modules/import-data/components/shared/ui";
import { coverageLabel, monthLabel } from "./format";

const Note = ({ children }: { children: React.ReactNode }) => (
  <p className="border-border-subtle mt-3 border-t pt-2 text-[10px] leading-relaxed text-slate-400">
    {children}
  </p>
);

/**
 * "What kind of ETFs": equity / gold / debt / international, read from what
 * each scheme disclosed. Rows are shares of the whole book on one 0–100 axis
 * and are never rebased to 100 — a cash sliver stays a sliver.
 */
export function EtfTypeBreakdownCard({
  breakdown,
  bookValue,
}: {
  breakdown: EtfTypeBreakdown;
  bookValue: number | null;
}) {
  if (breakdown.items.length === 0) return null;
  const month = monthLabel(breakdown.disclosure_month);
  return (
    <DataPanel title="What kind of ETFs">
      <div className="divide-border-subtle -my-2 divide-y">
        {breakdown.items.map((item) => (
          <div
            key={item.name}
            className="space-y-1 py-2.5 text-[11px]"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-forest-deep truncate dark:text-white">
                {item.name}
              </span>
              <span className="shrink-0 tabular-nums">
                <span className="text-forest-deep font-medium dark:text-white">
                  {item.value.toFixed(1)}%
                </span>
                {bookValue != null && (
                  <span className="ml-1.5 text-slate-400">
                    {formatINRShort((bookValue * item.value) / 100)}
                  </span>
                )}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-[#063BAA] dark:bg-[#8FB4FF]"
                style={{
                  width: `${Math.max(1, Math.min(100, item.value))}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <Note>
        {month
          ? `From the asset-class composition in each scheme's ${month} disclosure.`
          : "From the asset-class composition each scheme disclosed."}{" "}
        The rows are shares of your whole book and add up to what the schemes
        disclosed — cash included, never rebased to 100%.
        {breakdown.coverage_pct < 99.5 &&
          ` Covers ${coverageLabel(breakdown.coverage_pct)}% of the book — the rest disclosed no composition.`}
      </Note>
    </DataPanel>
  );
}

/**
 * "What your ETFs hold underneath": the sectors and the largest stocks seen
 * through the wrappers. A stock's weight is its share of the fund times the
 * fund's share of the book.
 */
export function EtfLookThroughCard({
  look,
  bookValue,
}: {
  look: EtfLookThrough;
  bookValue: number | null;
}) {
  const [showAll, setShowAll] = useState(false);
  if (look.sectors.length === 0 && look.top_holdings.length === 0) return null;
  const month = monthLabel(look.disclosure_month);
  const stocks = showAll ? look.top_holdings : look.top_holdings.slice(0, 5);
  return (
    <DataPanel
      title="What your ETFs hold underneath"
      addon={month ? `Disclosed for ${month}` : undefined}
      bodyClassName="space-y-4"
    >
      {look.sectors.length > 0 && (
        // Sector rows are shares of the whole book; the rest is drawn as its
        // own slice so the donut never rebases the seen-through part to 100%.
        <DonutBreakdown
          max={7}
          segments={[
            ...look.sectors,
            {
              name: "Outside the look-through",
              value: Math.max(
                0,
                100 - look.sectors.reduce((s, x) => s + x.value, 0),
              ),
              color: "#CBD5E1",
            },
          ]}
        />
      )}
      {stocks.length > 0 && (
        <div>
          <p className="mb-1 text-[9.5px] font-medium tracking-wider text-slate-400 uppercase">
            Largest stocks through the wrapper
          </p>
          <div className="divide-border-subtle divide-y">
            {stocks.map((s) => (
              <div
                key={`${s.fincode ?? s.name}`}
                className="flex items-center justify-between gap-3 py-2 text-[11px]"
              >
                <div className="min-w-0">
                  <p className="text-forest-deep truncate font-medium dark:text-white">
                    {s.name}
                  </p>
                  <p className="truncate text-[9.5px] text-slate-400">
                    {s.via_scheme_count > 1
                      ? `via ${s.via_scheme_count} of your ETFs`
                      : `via ${s.scheme_name}`}{" "}
                    · {s.sector}
                  </p>
                </div>
                <span className="text-forest-deep shrink-0 font-medium tabular-nums dark:text-white">
                  {s.weight_pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
          {look.top_holdings.length > 5 && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="hover-tint mt-2 w-full rounded-full border border-slate-200 py-2 text-[10.5px] font-medium text-slate-500 dark:border-slate-700 dark:text-slate-300"
            >
              Show all {look.top_holdings.length} stocks
            </button>
          )}
        </div>
      )}
      <Note>
        Covers {coverageLabel(look.coverage_pct)}% of this book
        {bookValue != null &&
          ` — ${formatINRShort(look.covered_value)} of ${formatINRShort(bookValue)}`}
        , the domestic-equity part of your ETFs. {look.total_holdings} stocks in
        all. Gold, overseas and debt schemes hold no Indian stocks to see
        through.
      </Note>
    </DataPanel>
  );
}
