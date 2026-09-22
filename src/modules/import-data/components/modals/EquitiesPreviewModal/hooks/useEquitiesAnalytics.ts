import {
  useAnalyzePortfolioApiPortfoliosAnalyzePost,
  analyzePortfolioApiPortfoliosAnalyzePostResponse200,
} from "@/api/generated/portfolio-apis/portfolio-apis/portfolio-apis";
import { AnalysisInputUnit } from "@/api/generated/portfolio-apis/models/analysisInputUnit";
import { EquityHoldingWithQuantity } from "@/modules/import-data/types/equities";
import { transformEquitiesToPortfolioItems } from "../utils/equities-to-portfolio-items";
import { toast } from "sonner";

/**
 * Hook to analyze equity portfolio using the Portfolio Analysis API
 * Uses Tanstack Query mutation for state management
 */
export function useEquitiesAnalytics() {
  const mutation = useAnalyzePortfolioApiPortfoliosAnalyzePost();

  const analyzePortfolio = (holdings: EquityHoldingWithQuantity[]) => {
    const items = transformEquitiesToPortfolioItems(holdings);

    if (items.length === 0) {
      toast.error(
        "No valid holdings to analyze. Ensure at least one holding has quantity greater than zero.",
      );
      return;
    }

    mutation.mutate({
      data: {
        items,
        input_unit: AnalysisInputUnit.quantity,
        duration: "1y",
      },
    });
  };

  const response = mutation.data;
  const analytics =
    response?.status === 200
      ? (response as analyzePortfolioApiPortfoliosAnalyzePostResponse200).data
      : null;

  // A non-200 reply (e.g. 422 for unrecognised holdings) resolves the
  // mutation without data — surface it as a failed run, not a silent reset.
  const failed = mutation.isError || (!!response && response.status !== 200);

  return {
    analytics,
    isAnalyzing: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    failed,
    analyzePortfolio,
    reset: mutation.reset,
  };
}
