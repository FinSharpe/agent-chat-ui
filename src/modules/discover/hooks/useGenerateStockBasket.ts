import { useMutation } from "@tanstack/react-query";
import type { StockBasketConfig } from "../types/basket-builder.types";
import type { CreateCustomPortfolioResponse } from "@/api/generated/portfolio-apis/models";
import { createCustomPortfolioApiPortfoliosCreatePost } from "@/api/generated/portfolio-apis/portfolio-apis/portfolio-apis";
import { mapConfigToApiRequest } from "../utils/basket-api-mapper";

/**
 * Hook to generate stock basket using real portfolio API
 */
export function useGenerateStockBasket() {
  return useMutation({
    mutationFn: async (
      config: StockBasketConfig,
    ): Promise<CreateCustomPortfolioResponse> => {
      // Transform config to API request format
      const apiRequest = mapConfigToApiRequest(config);

      // Call the portfolio API
      const response =
        await createCustomPortfolioApiPortfoliosCreatePost(apiRequest);

      // Handle API errors
      if (response.status !== 200) {
        throw new Error(
          `Failed to generate basket: ${response.status} ${
            (response.data as any)?.detail || "Unknown error"
          }`,
        );
      }

      // Return API response directly
      return response.data;
    },
  });
}
