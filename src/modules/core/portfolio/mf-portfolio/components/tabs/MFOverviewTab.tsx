import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { DistributionItem } from "@/api/generated/mf-portfolio-apis/models";
import { chartSeriesColor } from "@/lib/chart-colors";

interface MFOverviewTabProps {
  categoryWiseAllocations: DistributionItem[];
}

/**
 * MF Portfolio Overview Tab Component
 * Displays SEBI category allocation pie chart
 */
export function MFOverviewTab({ categoryWiseAllocations }: MFOverviewTabProps) {
  // Add token-backed colors to distribution items (theme-aware via CSS vars)
  const categoriesWithColors = categoryWiseAllocations.map((item, index) => ({
    ...item,
    color: chartSeriesColor(index),
  }));

  return (
    <div className="space-y-6 pb-28">
      {/* SEBI Category Allocation */}
      <Card className="p-4">
        <h3 className="text-text-primary mb-4 font-medium">
          SEBI Category Allocation
        </h3>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="h-48 flex-shrink-0 md:w-48">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={categoriesWithColors}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoriesWithColors.map((entry, index) => (
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
            {categoriesWithColors.map((category, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-text-secondary truncate text-sm">
                    {category.name}
                  </span>
                </div>
                <span className="text-text-primary text-sm font-medium">
                  {category.value.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
