import {
  useGetMfPortfolioAnalyticsApiMfPortfoliosAnalyticsPost,
  getMfPortfolioAnalyticsApiMfPortfoliosAnalyticsPostResponse200,
} from "@/api/generated/mf-portfolio-apis/mf-portfolio-apis/mf-portfolio-apis";
import { AnalysisInputUnit } from "@/api/generated/mf-portfolio-apis/models/analysisInputUnit";
import { MutualFundHoldingWithQuantity } from "@/modules/import-data/types/mutual-funds";
import { transformMutualFundsToPortfolioItems } from "../utils/mutual-funds-to-portfolio-items";
import { toast } from "sonner";

/**
 * Hook to analyze mutual fund portfolio using the MF Portfolio Analytics API
 * Uses Tanstack Query mutation for state management
 */
export function useMutualFundsAnalytics() {
  const mutation = useGetMfPortfolioAnalyticsApiMfPortfoliosAnalyticsPost();

  const analyzePortfolio = (holdings: MutualFundHoldingWithQuantity[]) => {
    const items = transformMutualFundsToPortfolioItems(holdings);

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
      ? (
          response as getMfPortfolioAnalyticsApiMfPortfoliosAnalyticsPostResponse200
        ).data
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
