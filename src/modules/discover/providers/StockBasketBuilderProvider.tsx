"use client";

import { createContext, ReactNode, useState } from "react";
import type { StockBasketConfig } from "../types/basket-builder.types";
import type { CreateCustomPortfolioResponse } from "@/api/generated/portfolio-apis/models";
import { useGenerateStockBasket } from "../hooks/useGenerateStockBasket";

/**
 * Context value interface for stock basket builder
 */
export interface StockBasketBuilderContextValue {
  basketConfig: StockBasketConfig;
  updateConfig: <K extends keyof StockBasketConfig>(
    key: K,
    value: StockBasketConfig[K],
  ) => void;
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  canProceed: () => boolean;
  showResults: boolean;
  setShowResults: (show: boolean) => void;
  handleComplete: () => void;
  handleModify: () => void;
  /** Leave the results for the first step of this flow, answers kept. */
  restart: () => void;
  generatedBasket: CreateCustomPortfolioResponse | null;
  isGenerating: boolean;
  generationError: string | null;
}

// eslint-disable-next-line react-refresh/only-export-components
export const StockBasketBuilderContext = createContext<
  StockBasketBuilderContextValue | undefined
>(undefined);

interface StockBasketBuilderProviderProps {
  children: ReactNode;
}

/**
 * Provider component for stock basket builder state management
 * Manages multi-step form state, navigation, and results display
 */
export function StockBasketBuilderProvider({
  children,
}: StockBasketBuilderProviderProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [generatedBasket, setGeneratedBasket] =
    useState<CreateCustomPortfolioResponse | null>(null);
  const [basketConfig, setBasketConfig] = useState<StockBasketConfig>({
    type: "stocks",
    investmentStyle: "",
    marketCap: [],
    customMarketCapRange: [500, 50000],
    portfolioSize: "",
    customStockCount: "",
    portfolioAllocation: "",
    stockPreferences: "",
  });

  const totalSteps = 4;

  // API mutation hook for generating basket
  const generateBasketMutation = useGenerateStockBasket();

  /**
   * Update a single field in basket configuration
   */
  const updateConfig = <K extends keyof StockBasketConfig>(
    key: K,
    value: StockBasketConfig[K],
  ) => {
    setBasketConfig((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Move to next step
   */
  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  /**
   * Move to previous step
   */
  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  /**
   * Jump to a specific step
   */
  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };

  /**
   * Check if user can proceed from current step
   */
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return basketConfig.investmentStyle !== "";
      case 2:
        return basketConfig.marketCap.length > 0;
      case 3:
        if (basketConfig.portfolioSize === "custom") {
          return (
            basketConfig.customStockCount !== "" &&
            parseInt(basketConfig.customStockCount) > 0
          );
        }
        return basketConfig.portfolioSize !== "";
      case 4:
        return basketConfig.portfolioAllocation !== "";
      default:
        return false;
    }
  };

  /**
   * Complete the form and generate basket via API
   */
  const handleComplete = async () => {
    try {
      // Call API to generate basket
      const result = await generateBasketMutation.mutateAsync(basketConfig);
      setGeneratedBasket(result);
      setShowResults(true);
    } catch (error) {
      console.error("Failed to generate basket:", error);
      // Error is already stored in generateBasketMutation.error
    }
  };

  /**
   * Go back to modify the basket configuration
   */
  const handleModify = () => {
    setShowResults(false);
    // Keep generated basket in case user wants to go back to results
  };

  const restart = () => {
    setShowResults(false);
    setCurrentStep(1);
  };

  const value: StockBasketBuilderContextValue = {
    basketConfig,
    updateConfig,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    goToStep,
    canProceed,
    showResults,
    setShowResults,
    handleComplete,
    handleModify,
    restart,
    generatedBasket,
    isGenerating: generateBasketMutation.isPending,
    generationError: generateBasketMutation.error
      ? (generateBasketMutation.error as Error).message
      : null,
  };

  return (
    <StockBasketBuilderContext.Provider value={value}>
      {children}
    </StockBasketBuilderContext.Provider>
  );
}
