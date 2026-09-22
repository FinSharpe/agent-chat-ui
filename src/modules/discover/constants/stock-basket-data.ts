import type {
  InvestmentStyleOption,
  MarketCapOption,
  PortfolioSizeOption,
  PortfolioAllocationOption,
} from "../types/basket-builder.types";
import {
  InvestmentStyle,
  MarketCap,
  PortfolioAllocation,
} from "@/api/generated/portfolio-apis/models";

/**
 * Available investment styles for stock baskets
 * Uses generated enum values from portfolio API
 */
export const investmentStyleOptions: InvestmentStyleOption[] = [
  {
    id: InvestmentStyle.growth,
    name: "Growth",
    description: "High growth potential companies",
  },
  {
    id: InvestmentStyle.value,
    name: "Value",
    description: "Undervalued quality stocks",
  },
  {
    id: InvestmentStyle.momentum,
    name: "Momentum",
    description: "Trending upward stocks",
  },
  {
    id: InvestmentStyle.quality,
    name: "Quality",
    description: "Strong fundamentals focus",
  },
];

/**
 * Available market cap options for stock baskets
 * Uses generated enum values from portfolio API (Large, Mid, Small)
 * "custom" is UI-only for custom range selection
 */
export const marketCapOptions: MarketCapOption[] = [
  {
    id: MarketCap.Large,
    name: "Large Cap",
    description: "₹20,000Cr+",
  },
  {
    id: MarketCap.Mid,
    name: "Mid Cap",
    description: "₹5,000–20,000Cr",
  },
  {
    id: MarketCap.Small,
    name: "Small Cap",
    description: "₹500–5,000Cr",
  },
  {
    id: "custom",
    name: "Custom Range",
    description: "Define your own range",
  },
];

/**
 * Available portfolio size options for stock baskets
 */
export const portfolioSizeOptions: PortfolioSizeOption[] = [
  {
    id: "concentrated",
    name: "Concentrated",
    description: "15 stocks",
    stockCount: "15",
  },
  {
    id: "diversified",
    name: "Diversified",
    description: "25 stocks",
    stockCount: "25",
  },
  {
    id: "custom",
    name: "Custom",
    description: "Enter a number",
    stockCount: "",
  },
];

/**
 * Available portfolio allocation strategies for stock baskets
 * Uses generated enum values from portfolio API
 */
export const portfolioAllocationOptions: PortfolioAllocationOption[] = [
  {
    id: PortfolioAllocation.balanced,
    name: "Overall Balanced",
    description: "Balanced weightage based on fundamentals & technicals",
  },
  {
    id: PortfolioAllocation.performance,
    name: "Performance Weighted",
    description: "Higher weights to top performers",
  },
  {
    id: PortfolioAllocation.growth,
    name: "Growth Weighted",
    description: "Focus on high growth stocks",
  },
  {
    id: PortfolioAllocation.value,
    name: "Value Weighted",
    description: "Emphasis on value stocks",
  },
];

/**
 * Step definitions for stock basket builder
 */
export const stockBasketSteps = [
  { number: 1, title: "Investment Style", description: "Choose your approach" },
  { number: 2, title: "Market Cap", description: "Select company sizes" },
  { number: 3, title: "Portfolio Size", description: "Number of stocks" },
  {
    number: 4,
    title: "Portfolio Allocation",
    description: "Weight distribution",
  },
];
