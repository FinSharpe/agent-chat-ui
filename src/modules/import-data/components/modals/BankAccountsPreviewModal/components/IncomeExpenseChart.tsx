/**
 * Income vs Expense Chart — monthly credits against debits as rounded-top
 * columns, in the reference palette (income blue, expenses amber).
 */

"use client";
import { BarChart3 } from "lucide-react";
import {
  DataPanel,
  formatINR,
} from "@/modules/import-data/components/shared/ui";
import { TrendChart } from "@/modules/import-data/components/shared/ui/TrendChart";
import { MonthlyData } from "../utils/transaction-analytics";
import { periodLabel } from "../utils/bank-insights";

interface IncomeExpenseChartProps {
  data: MonthlyData[];
  startDate?: string;
  endDate?: string;
  className?: string;
}

export function IncomeExpenseChart({
  data,
  startDate,
  endDate,
  className,
}: IncomeExpenseChartProps) {
  // The last 12 months keep the columns readable.
  const rows = (data ?? []).slice(-12);
  const period = periodLabel(startDate, endDate);

  return (
    <DataPanel
      title="Income vs Expenses"
      icon={BarChart3}
      iconClassName="text-[#0A9E6E]"
      addon={period}
      className={className}
    >
      {rows.length === 0 ? (
        <p className="py-8 text-center text-[11px] text-slate-400">
          No monthly data available
        </p>
      ) : (
        <div
          role="img"
          aria-label={`Monthly income versus expenses${period ? `, ${period}` : ""}.`}
        >
          <TrendChart
            kind="bar"
            data={rows}
            xKey="month"
            series={[
              { key: "income", name: "Income", color: "#063BAA" },
              { key: "expenses", name: "Expenses", color: "#F59E0B" },
            ]}
            height={150}
            xTickFormatter={(v) => String(v).slice(0, 3)}
            valueFormatter={(v) => formatINR(v)}
          />
        </div>
      )}
    </DataPanel>
  );
}
