/**
 * Balance Trend Chart — the reference "Balance Trend" card: a blue area chart
 * of the account balance after each transaction.
 */

"use client";
import { LineChart as LineChartIcon } from "lucide-react";
import {
  DataPanel,
  formatINR,
} from "@/modules/import-data/components/shared/ui";
import { TrendChart } from "@/modules/import-data/components/shared/ui/TrendChart";
import {
  monthLabel,
  monthTicks,
} from "@/modules/import-data/components/shared/ui/chart-ticks";
import { BalanceDataPoint } from "../utils/transaction-analytics";
import { periodLabel } from "../utils/bank-insights";

interface BalanceTrendChartProps {
  data: BalanceDataPoint[];
  startDate?: string;
  endDate?: string;
  className?: string;
  /** Line under the chart saying what the balance is a sum of. */
  caption?: string;
}

/** Thin long series so the area stays smooth and fast (~100 points). */
function downsample(data: BalanceDataPoint[], max = 100) {
  if (data.length <= max) return data;
  const step = Math.ceil(data.length / max);
  const out = data.filter((_, i) => i % step === 0);
  if (out[out.length - 1] !== data[data.length - 1])
    out.push(data[data.length - 1]);
  return out;
}

export function BalanceTrendChart({
  data,
  startDate,
  endDate,
  className,
  caption,
}: BalanceTrendChartProps) {
  const period = periodLabel(startDate, endDate);
  // A time axis (ms) so ticks land once per month; the tooltip shows the day.
  const rows = downsample(data ?? []).map((d) => ({
    ...d,
    t: new Date(d.date).getTime(),
  }));

  return (
    <DataPanel
      title="Balance Trend"
      icon={LineChartIcon}
      addon={period}
      className={className}
    >
      {rows.length === 0 ? (
        <p className="py-8 text-center text-[11px] text-slate-400">
          No transaction data available
        </p>
      ) : (
        <div
          role="img"
          aria-label={`Account balance trend${period ? `, ${period}` : ""}.`}
        >
          <TrendChart
            kind="area"
            data={rows}
            xKey="t"
            numericX
            xTicks={
              rows.length > 1
                ? monthTicks(rows[0].t, rows[rows.length - 1].t)
                : undefined
            }
            series={[{ key: "balance", name: "Balance", color: "#063BAA" }]}
            height={120}
            xTickFormatter={monthLabel}
            tooltipLabelFormatter={(v) =>
              new Date(Number(v)).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            }
            valueFormatter={(v) => formatINR(v)}
          />
        </div>
      )}
      {caption && <p className="mt-2 text-[10px] text-slate-400">{caption}</p>}
    </DataPanel>
  );
}
