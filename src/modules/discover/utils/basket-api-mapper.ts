import type {
  CreateCustomPortfolioRequest,
  MarketCap,
} from "@/api/generated/portfolio-apis/models";
import type { StockBasketConfig } from "../types/basket-builder.types";

/**
 * Transform stock basket configuration to API request format
 */
export function mapConfigToApiRequest(
  config: StockBasketConfig,
): CreateCustomPortfolioRequest {
  // Calculate number of stocks from portfolio size selection
  const numberOfStocks = calculateNumberOfStocks(config);

  // Handle custom market cap range vs predefined options
  const isCustomMarketCap = config.marketCap.includes("custom");

  const request: CreateCustomPortfolioRequest = {
    investmentStyle: config.investmentStyle as any, // Guaranteed to be InvestmentStyle by this point
    numberOfStocks,
    portfolioAllocation: config.portfolioAllocation as any, // Guaranteed to be PortfolioAllocation by this point
  };

  if (isCustomMarketCap) {
    // Use custom range, set marketCap to empty array
    request.customMarketCapRange = config.customMarketCapRange;
    request.marketCap = [];
  } else {
    // Use predefined market cap selections (filter out "custom" if somehow present)
    request.marketCap = config.marketCap.filter(
      (cap) => cap !== "custom",
    ) as MarketCap[];
  }

  return request;
}

/**
 * Calculate number of stocks from portfolio size configuration
 */
function calculateNumberOfStocks(config: StockBasketConfig): number {
  switch (config.portfolioSize) {
    case "concentrated":
      return 15;
    case "diversified":
      return 25;
    case "custom":
      return parseInt(config.customStockCount) || 20;
    default:
      return 20; // Fallback
  }
}
