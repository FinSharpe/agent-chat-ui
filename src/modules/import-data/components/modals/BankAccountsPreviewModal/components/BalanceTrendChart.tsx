/**
 * Balance Trend Chart Component
 * Displays account balance over time using a soft area chart
 */

"use client";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import {
  DataPanel,
  formatINR,
  formatINRCompact,
} from "@/modules/import-data/components/shared/ui";
import { BalanceDataPoint } from "../utils/transaction-analytics";

interface BalanceTrendChartProps {
  data: BalanceDataPoint[];
  startDate?: string;
  endDate?: string;
  className?: string;
}

/** Token-styled tooltip card. */
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: BalanceDataPoint }>;
}) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;

  return (
    <div className="border-border bg-popover max-w-xs rounded-lg border p-3 shadow-lg">
      <p className="text-text-tertiary text-xs">{point.formattedDate}</p>
      <p className="text-text-primary mt-0.5 text-base font-semibold tabular-nums">
        {formatINR(point.balance)}
      </p>
      <p className="text-text-tertiary mt-0.5 text-[11px]">Account balance</p>
    </div>
  );
}

/**
 * Balance Trend Chart Component
 */
export function BalanceTrendChart({
  data,
  startDate,
  endDate,
  className,
}: BalanceTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <DataPanel
        title="Balance Trend"
        icon={TrendingUp}
        className={className}
      >
        <div className="text-text-tertiary flex h-[250px] items-center justify-center text-sm">
          No transaction data available
        </div>
      </DataPanel>
    );
  }

  // Limit data points for better performance (show every nth point if too many)
  const MAX_POINTS = 100;
  let displayData = data;
  if (data.length > MAX_POINTS) {
    const step = Math.ceil(data.length / MAX_POINTS);
    displayData = data.filter((_, index) => index % step === 0);
    if (displayData[displayData.length - 1] !== data[data.length - 1]) {
      displayData.push(data[data.length - 1]);
    }
  }

  return (
    <DataPanel
      title="Balance Trend"
      icon={TrendingUp}
      className={className}
    >
      <p className="text-text-tertiary mb-3 text-xs">
        How your balance moved
        {startDate && endDate ? ` from ${startDate} to ${endDate}` : ""}
      </p>
      <div
        role="img"
        aria-label={`Account balance trend${startDate && endDate ? ` from ${startDate} to ${endDate}` : ""}. Figures are summarised in the stat tiles above.`}
      >
        <ResponsiveContainer
          width="100%"
          height={260}
        >
          <AreaChart
            data={displayData}
            margin={{ top: 5, right: 12, left: -12, bottom: 5 }}
          >
            <defs>
              <linearGradient
                id="balanceFill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--brand-teal)"
                  stopOpacity={0.28}
                />
                <stop
                  offset="100%"
                  stopColor="var(--brand-teal)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--chart-grid)"
            />
            <XAxis
              dataKey="formattedDate"
              tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              interval="preserveStartEnd"
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
              cursor={{ stroke: "var(--brand-teal)", strokeOpacity: 0.4 }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="var(--brand-teal)"
              strokeWidth={2}
              fill="url(#balanceFill)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: "var(--brand-teal)" }}
              name="Balance"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DataPanel>
  );
}
