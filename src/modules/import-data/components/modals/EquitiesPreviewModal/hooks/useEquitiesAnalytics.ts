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

  return {
    analytics,
    isAnalyzing: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    analyzePortfolio,
    reset: mutation.reset,
  };
}
