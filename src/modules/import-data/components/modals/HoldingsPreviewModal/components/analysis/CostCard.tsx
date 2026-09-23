"use client";
import { Receipt } from "lucide-react";
import type { MFCostAnalysis } from "@/api/generated/mf-portfolio-apis/models";
import {
  DataPanel,
  MeterRow,
  Notice,
  formatINR,
  formatINRShort,
} from "@/modules/import-data/components/shared/ui";

/** Expense ratio shown against a 2.5% ceiling — the top of the retail range. */
const ER_SCALE = 2.5;

/**
 * Fund cost from the MF analytics' cost analysis: the weighted expense ratio
 * as a meter, the yearly and monthly drag on a reference portfolio value, and
 * a one-line verdict.
 */
export function CostCard({ cost }: { cost: MFCostAnalysis | undefined }) {
  if (!cost) return null;
  const er = cost.weighted_expense_ratio;
  const tone = er <= 0.5 ? "success" : er <= 1 ? "info" : "warning";
  const bar =
    er <= 0.5 ? "bg-[#0A9E6E]" : er <= 1 ? "bg-amber-500" : "bg-rose-500";

  return (
    <DataPanel
      title="Cost Analysis"
      icon={Receipt}
      iconClassName="text-amber-500"
      bodyClassName="space-y-3 text-[10px]"
    >
      <MeterRow
        label="Weighted expense ratio"
        valueLabel={`${er.toFixed(2)}%`}
        pct={(er / ER_SCALE) * 100}
        barClass={bar}
      />
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-nested space-y-0.5 bg-slate-50 p-3 text-center dark:bg-slate-800/40">
          <p className="font-geist text-forest-deep text-sm font-medium tabular-nums dark:text-white">
            {formatINR(cost.annual_cost)}
          </p>
          <p className="text-[8.5px] text-slate-400">
            Yearly cost on {formatINRShort(cost.portfolio_value)}
          </p>
        </div>
        <div className="rounded-nested space-y-0.5 bg-slate-50 p-3 text-center dark:bg-slate-800/40">
          <p className="font-geist text-forest-deep text-sm font-medium tabular-nums dark:text-white">
            {formatINR(cost.monthly_cost)}
          </p>
          <p className="text-[8.5px] text-slate-400">Per month</p>
        </div>
      </div>
      <Notice tone={tone}>
        {er <= 0.5
          ? `A ${er.toFixed(2)}% blended expense ratio is low — more of your returns stay with you.`
          : er <= 1
            ? `A ${er.toFixed(2)}% blended expense ratio is moderate; direct plans or index funds could trim it.`
            : `A ${er.toFixed(2)}% blended expense ratio is high — consider direct plans or lower-cost funds.`}
      </Notice>
    </DataPanel>
  );
}
