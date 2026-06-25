import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MFPortfolioItem } from "@/types/mf-portfolio";

interface MFHoldingsTabProps {
  holdings: MFPortfolioItem[];
}

/**
 * MF Portfolio Holdings Tab Component
 * Displays mutual fund holdings in a table with scheme names, categories, weights, and scores
 */
export function MFHoldingsTab({ holdings }: MFHoldingsTabProps) {
  // Check if all weights are null or zero - if so, display quantity instead
  const allWeightsEmpty = holdings.every(
    (h) => h.weight === null || h.weight === 0,
  );
  const showQuantity = allWeightsEmpty;

  return (
    <div className="space-y-6 pb-28">
      <Card className="p-4">
        <h3 className="text-text-primary mb-4 font-medium">
          Portfolio Holdings
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Scheme Name</TableHead>
                <TableHead className="hidden text-left md:table-cell">
                  SEBI Category
                </TableHead>
                <TableHead className="text-right">
                  {showQuantity ? "Quantity" : "Weight"}
                </TableHead>
                <TableHead className="hidden text-right md:table-cell">
                  Performance
                </TableHead>
                <TableHead className="hidden text-right md:table-cell">
                  Risk
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((holding, index) => (
                <TableRow key={holding.ISIN || index}>
                  <TableCell>
                    <div>
                      <div className="text-text-primary line-clamp-2 font-medium">
                        {holding.Scheme_Name}
                      </div>
                      <div className="text-text-tertiary text-xs md:hidden">
                        {holding.Sebi_Category}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-text-secondary hidden md:table-cell">
                    {holding.Sebi_Category}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {showQuantity
                      ? (holding.quantity ?? "-")
                      : `${holding.weight?.toFixed(2) ?? "-"}%`}
                  </TableCell>
                  <TableCell className="hidden text-right md:table-cell">
                    <ScoreBadge
                      score={holding.PerformanceScore}
                      type="performance"
                    />
                  </TableCell>
                  <TableCell className="hidden text-right md:table-cell">
                    <ScoreBadge
                      score={holding.RiskScore}
                      type="risk"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

interface ScoreBadgeProps {
  score: number;
  type: "performance" | "risk";
}

function ScoreBadge({ score, type }: ScoreBadgeProps) {
  const getColor = () => {
    if (type === "performance") {
      // Higher is better for performance
      if (score >= 60) return "bg-risk-low-bg text-risk-low-fg";
      if (score >= 30) return "bg-risk-medium-bg text-risk-medium-fg";
      return "bg-risk-high-bg text-risk-high-fg";
    } else {
      // Lower is better for risk
      if (score <= 30) return "bg-risk-low-bg text-risk-low-fg";
      if (score <= 60) return "bg-risk-medium-bg text-risk-medium-fg";
      return "bg-risk-high-bg text-risk-high-fg";
    }
  };

  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${getColor()}`}
    >
      {score.toFixed(0)}
    </span>
  );
}
