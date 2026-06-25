/**
 * Income vs Expense Chart Component
 * Displays monthly income and expenses comparison using a bar chart
 */

"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import {
  DataPanel,
  formatINR,
  formatINRCompact,
} from "@/modules/import-data/components/shared/ui";
import { MonthlyData } from "../utils/transaction-analytics";

interface IncomeExpenseChartProps {
  data: MonthlyData[];
  startDate?: string;
  endDate?: string;
  className?: string;
}

/** Token-styled tooltip card. */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: MonthlyData }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="border-border bg-popover max-w-xs rounded-lg border p-3 shadow-lg">
      <p className="text-text-primary text-sm font-medium">{label}</p>
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="text-text-tertiary text-xs">Income</span>
          <span className="text-success-fg text-xs font-semibold tabular-nums">
            {formatINR(data.income)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-text-tertiary text-xs">Expenses</span>
          <span className="text-error-fg text-xs font-semibold tabular-nums">
            {formatINR(data.expenses)}
          </span>
        </div>
        <div className="border-border-subtle flex items-center justify-between gap-6 border-t pt-1">
          <span className="text-text-tertiary text-xs">Net Flow</span>
          <span
            className={`text-xs font-bold tabular-nums ${
              data.netFlow >= 0 ? "text-success-fg" : "text-error-fg"
            }`}
          >
            {formatINR(data.netFlow)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Income vs Expense Chart Component
 */
export function IncomeExpenseChart({
  data,
  startDate,
  endDate,
  className,
}: IncomeExpenseChartProps) {
  if (!data || data.length === 0) {
    return (
      <DataPanel
        title="Income vs Expenses"
        icon={BarChart3}
        className={className}
      >
        <div className="text-text-tertiary flex h-[250px] items-center justify-center text-sm">
          No monthly data available
        </div>
      </DataPanel>
    );
  }

  // Limit to last 12 months for better readability
  const displayData = data.slice(-12);

  return (
    <DataPanel
      title="Income vs Expenses"
      icon={BarChart3}
      className={className}
    >
      <p className="text-text-tertiary mb-3 text-xs">
        Monthly cash flow
        {startDate && endDate ? ` from ${startDate} to ${endDate}` : ""}
      </p>
      <div
        role="img"
        aria-label={`Monthly income versus expenses${startDate && endDate ? ` from ${startDate} to ${endDate}` : ""}. Totals are summarised in the stat tiles above.`}
      >
        <ResponsiveContainer
          width="100%"
          height={260}
        >
          <BarChart
            data={displayData}
            margin={{ top: 5, right: 12, left: -12, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--chart-grid)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              angle={-40}
              textAnchor="end"
              height={70}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tickFormatter={(v) => formatINRCompact(v)}
              width={64}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "var(--bg-hover)" }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 12, color: "var(--text-tertiary)" }}
            />
            <Bar
              dataKey="income"
              fill="var(--chart-positive)"
              name="Income"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="expenses"
              fill="var(--chart-negative)"
              name="Expenses"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DataPanel>
  );
}
