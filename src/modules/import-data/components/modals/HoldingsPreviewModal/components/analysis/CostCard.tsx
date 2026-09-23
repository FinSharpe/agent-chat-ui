"use client";
import type { CostAnalysis } from "@/modules/import-data/types/holdings-analysis";
import {
  DataPanel,
  formatINR,
} from "@/modules/import-data/components/shared/ui";
import { coverageLabel } from "./format";

/**
 * What the book costs to hold: the weighted expense ratio and the rupee drag
 * it implies — a property of today's holdings. Only the ETF endpoint's
 * `portfolio_value` is the user's own book (the MF endpoint serves a fixed
 * ₹1,00,000 reference base there), so the annual figure is qualified by a
 * value only when `basisValue` is passed.
 */
export function CostCard({
  cost,
  basisValue,
}: {
  cost: CostAnalysis | null;
  basisValue?: number | null;
}) {
  if (!cost) return null;
  const er = cost.weighted_expense_ratio;
  const rows = [
    {
      label: "Weighted expense ratio",
      value: er == null ? "—" : `${er.toFixed(2)}%`,
    },
    {
      label: "Estimated annual cost",
      value: cost.annual_cost == null ? "—" : formatINR(cost.annual_cost),
      caption:
        basisValue != null
          ? `on ${formatINR(basisValue)} at today's weights`
          : "on a ₹1,00,000 reference value",
    },
    {
      label: "Estimated monthly cost",
      value: cost.monthly_cost == null ? "—" : formatINR(cost.monthly_cost),
    },
  ];
  const coverage = cost.coverage_pct;
  return (
    <DataPanel title="Cost of ownership">
      <div className="divide-border-subtle -my-2 divide-y">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-3 py-2 text-[11px]"
          >
            <div className="min-w-0">
              <p className="text-forest-deep dark:text-white">{r.label}</p>
              {r.caption && (
                <p className="text-[9.5px] text-slate-400">{r.caption}</p>
              )}
            </div>
            <span className="text-forest-deep shrink-0 font-medium tabular-nums dark:text-white">
              {r.value}
            </span>
          </div>
        ))}
      </div>
      {coverage != null && coverage < 99.5 && (
        <p className="border-border-subtle mt-3 border-t pt-2 text-[10px] text-slate-400">
          Covers {coverageLabel(coverage)}% of value — the rest published no
          expense ratio.
        </p>
      )}
    </DataPanel>
  );
}
