import { MissingHolding } from "@/api/generated/strategy-apis/models";
import { AlertTriangle } from "lucide-react";

interface MissingHoldingsWarningProps {
  missingHoldings: MissingHolding[];
}

const reasonLabels: Record<string, string> = {
  missing_in_closing: "Missing price data",
  missing_in_screener: "Missing screener data",
  missing_in_both: "Missing price and screener data",
};

/**
 * Warning component to display holdings that are excluded from analytics
 * due to missing data in closing prices or screener.
 */
export function MissingHoldingsWarning({
  missingHoldings,
}: MissingHoldingsWarningProps) {
  if (!missingHoldings || missingHoldings.length === 0) {
    return null;
  }

  const totalWeight = missingHoldings.reduce(
    (sum, holding) => sum + holding.weight,
    0,
  );

  return (
    <div className="bg-warning-bg border-warning-border mx-6 my-4 rounded-lg border p-4">
      <div className="mb-3 flex items-start gap-3">
        <AlertTriangle className="text-warning-fg mt-0.5 h-5 w-5 flex-shrink-0" />
        <div>
          <h3 className="text-warning-fg mb-1 font-semibold">
            Incomplete Analytics Data
          </h3>
          <p className="text-warning-fg text-sm">
            The following holdings ({missingHoldings.length} ticker
            {missingHoldings.length > 1 ? "s" : ""}, {totalWeight.toFixed(1)}%
            of portfolio) could not be included in the analytics due to missing
            data. The portfolio analytics shown below do not consider these
            holdings.
          </p>
        </div>
      </div>

      <div className="bg-bg-card mt-3 max-h-40 overflow-y-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle sticky top-0 border-b">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Ticker</th>
              <th className="px-3 py-2 text-right font-medium">Weight</th>
              <th className="px-3 py-2 text-left font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {missingHoldings.map((holding) => (
              <tr
                key={holding.Ticker}
                className="border-b last:border-b-0"
              >
                <td className="px-3 py-2 font-mono">{holding.Ticker}</td>
                <td className="px-3 py-2 text-right">
                  {holding.weight.toFixed(2)}%
                </td>
                <td className="text-text-muted px-3 py-2">
                  {reasonLabels[holding.reason] || holding.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
