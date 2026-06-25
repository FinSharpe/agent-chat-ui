import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { DistributionItem } from "@/api/generated/strategy-apis/models";
import {
  CHART_NEGATIVE,
  CHART_POSITIVE,
  CHART_SERIES,
  chartSeriesColor,
} from "@/lib/chart-colors";

interface OverviewTabProps {
  industryDistribution: DistributionItem[];
  sizeDistribution: DistributionItem[];
  isLongShort: boolean;
}

// Token-backed palette for pie charts (theme-aware via CSS vars)
const PIE_COLORS = CHART_SERIES;

// Color palette for size distribution bars
const SIZE_COLORS = {
  Large: CHART_SERIES[0],
  Mid: CHART_SERIES[1],
  Small: CHART_SERIES[2],
};

/**
 * Portfolio Overview Tab Component
 * Displays industry allocation and market cap allocation
 * For long-short portfolios, uses diverging bar charts to show positive and negative weights
 * For long-only portfolios, uses pie charts
 */
export function OverviewTab({
  industryDistribution,
  sizeDistribution,
  isLongShort,
}: OverviewTabProps) {
  // Add colors to distribution items
  const industryWithColors = industryDistribution.map((item, index) => ({
    ...item,
    color: chartSeriesColor(index),
  }));

  const sizeWithColors = sizeDistribution.map((item) => ({
    ...item,
    color: SIZE_COLORS[item.name as keyof typeof SIZE_COLORS] || PIE_COLORS[0],
  }));

  // Helper to render left-aligned bar for industry
  const renderIndustryBar = (
    item: DistributionItem & { color: string },
    index: number,
  ) => {
    const isPositive = item.value >= 0;
    const absValue = Math.abs(item.value);
    const barColor = isPositive ? CHART_POSITIVE : CHART_NEGATIVE; // Long vs Short

    return (
      <div
        key={index}
        className="grid grid-cols-[minmax(140px,1fr)_3fr_60px] items-center gap-4"
      >
        {/* Label */}
        <div
          className="text-text-secondary truncate text-right text-sm"
          title={item.name}
        >
          {item.name}
        </div>

        {/* Left Aligned Bar */}
        <div className="flex h-8 w-full items-center">
          <div className="bg-bg-subtle relative h-5 w-full overflow-hidden rounded-sm">
            <div
              className="h-full rounded-sm transition-all"
              style={{
                backgroundColor: barColor,
                width: `${Math.min(absValue, 100)}%`, // Scale 0-100%
              }}
            ></div>
          </div>
        </div>

        {/* Value */}
        <div
          className={`text-right text-sm font-medium tabular-nums ${isPositive ? "text-success-fg" : "text-error-fg"}`}
        >
          {item.value >= 0 ? "+" : ""}
          {item.value.toFixed(1)}%
        </div>
      </div>
    );
  };

  // Helper for Stacked Bar (Market Cap)
  const renderStackedBar = () => {
    // Calculate total absolute value to normalize percentages
    const total = sizeWithColors.reduce(
      (acc, item) => acc + Math.abs(item.value),
      0,
    );

    if (total === 0) return null;

    return (
      <div className="mt-2">
        {/* Stacked Bar */}
        <div className="bg-bg-subtle flex h-8 w-full overflow-hidden rounded-md">
          {sizeWithColors.map((item, index) => {
            const widthPct = (Math.abs(item.value) / total) * 100;
            if (widthPct === 0) return null;
            return (
              <div
                key={index}
                style={{ width: `${widthPct}%`, backgroundColor: item.color }}
                className="group relative h-full transition-opacity hover:opacity-90"
              >
                {/* Tooltip on hover */}
                <div className="bg-bg-card border-border-default text-text-primary absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded border p-2 text-xs whitespace-nowrap shadow-lg group-hover:block">
                  {item.name}: {item.value.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {sizeWithColors.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2"
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-text-secondary text-sm">
                {item.name} ({item.value.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Industry Allocation */}
      <Card className="p-4">
        <h3 className="text-text-primary mb-4 font-medium">
          Industry Allocation{" "}
          {isLongShort && (
            <span className="text-text-tertiary ml-2 text-xs">
              (Long/Short)
            </span>
          )}
        </h3>
        {isLongShort ? (
          // Left-aligned bar chart for long-short portfolios
          <div className="space-y-2">
            {industryWithColors.map((industry, index) =>
              renderIndustryBar(industry, index),
            )}
          </div>
        ) : (
          // Pie chart for long-only portfolios
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="h-48 flex-shrink-0 md:w-48">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={industryWithColors}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {industryWithColors.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${Number(value).toFixed(2)}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid flex-1 grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2">
              {industryWithColors.map((industry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: industry.color }}
                    ></div>
                    <span className="text-text-secondary text-sm">
                      {industry.name}
                    </span>
                  </div>
                  <span className="text-text-primary text-sm font-medium">
                    {industry.value.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Size Allocation */}
      <Card className="p-4">
        <h3 className="text-text-primary mb-4 font-medium">
          Market Cap Allocation{" "}
          {isLongShort && (
            <span className="text-text-tertiary ml-2 text-xs">
              (Long/Short)
            </span>
          )}
        </h3>
        {isLongShort ? (
          // Stacked bar for long-short portfolios
          renderStackedBar()
        ) : (
          // Standard progress bars for long-only portfolios
          <div className="space-y-3">
            {sizeWithColors.map((size, index) => (
              <div key={index}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-text-secondary text-sm">
                    {size.name}
                  </span>
                  <span className="text-text-primary text-sm font-medium">
                    {size.value.toFixed(2)}%
                  </span>
                </div>
                <div className="bg-border-default h-2 w-full rounded-full">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${size.value}%`,
                      backgroundColor: size.color,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
