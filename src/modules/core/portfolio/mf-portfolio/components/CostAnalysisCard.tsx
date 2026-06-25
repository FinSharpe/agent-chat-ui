import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MFCostAnalysis } from "@/api/generated/mf-portfolio-apis/models";
import { Info } from "lucide-react";

interface CostAnalysisCardProps {
  costAnalysis: MFCostAnalysis;
}

/**
 * Cost Analysis Card for MF portfolios
 * Displays expense ratio percentage with progress bar and estimated annual cost
 */
export function CostAnalysisCard({ costAnalysis }: CostAnalysisCardProps) {
  const expenseRatio = costAnalysis.weighted_expense_ratio;
  const annualCost = costAnalysis.annual_cost;
  const portfolioValue = costAnalysis.portfolio_value;

  // Determine expense ratio quality (for visual indication)
  const getExpenseRatioColor = (ratio: number) => {
    if (ratio <= 0.5) return "bg-success-bg";
    if (ratio <= 1.0) return "bg-warning-bg";
    return "bg-error-bg";
  };

  const getExpenseRatioTextColor = (ratio: number) => {
    if (ratio <= 0.5) return "text-success-fg";
    if (ratio <= 1.0) return "text-warning-fg";
    return "text-error-fg";
  };

  const getExpenseRatioBarColor = (ratio: number) => {
    if (ratio <= 0.5) return "bg-success-fg";
    if (ratio <= 1.0) return "bg-warning-fg";
    return "bg-error-fg";
  };

  // Scale for progress bar (assuming max 2.5% expense ratio for visualization)
  const progressPercentage = Math.min((expenseRatio / 2.5) * 100, 100);

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-text-primary text-lg font-semibold">
          Cost Analysis
        </h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="hover:bg-bg-hover rounded-full p-1 transition-colors">
              <Info className="text-text-tertiary h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">
              The weighted average expense ratio of your portfolio. Lower
              expense ratios mean more of your returns stay with you.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-6">
        {/* Expense Ratio */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-text-secondary text-sm">
              Weighted Avg. Expense Ratio
            </span>
            <span
              className={`text-lg font-semibold ${getExpenseRatioTextColor(expenseRatio)}`}
            >
              {expenseRatio.toFixed(2)}%
            </span>
          </div>
          <div className="bg-border-default h-2 w-full overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full transition-all ${getExpenseRatioBarColor(expenseRatio)}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-text-tertiary mt-1 flex justify-between text-xs">
            <span>0%</span>
            <span>2.5%</span>
          </div>
        </div>

        {/* Estimated Annual Cost */}
        <div className={`rounded-lg p-4 ${getExpenseRatioColor(expenseRatio)}`}>
          <div className="text-text-secondary mb-1 text-sm">
            Estimated Annual Cost
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-text-primary text-2xl font-bold">
              {annualCost.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              })}
            </span>
            <span className="text-text-tertiary text-sm">
              on{" "}
              {portfolioValue.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              })}{" "}
              investment
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="text-text-tertiary flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="bg-success-fg h-2 w-2 rounded-full" />
            <span>Low (&lt;0.5%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="bg-warning-fg h-2 w-2 rounded-full" />
            <span>Medium (0.5-1%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="bg-error-fg h-2 w-2 rounded-full" />
            <span>High (&gt;1%)</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
