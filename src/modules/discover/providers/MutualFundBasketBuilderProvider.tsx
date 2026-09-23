"use client";

import { createContext, ReactNode, useState } from "react";
import type { MutualFundBasketConfig } from "../types/basket-builder.types";
import type { PlanType } from "@/api/generated/mf-portfolio-apis/models/planType";
import type { FundCategory } from "@/api/generated/mf-portfolio-apis/models/fundCategory";
import type { CreateMFPortfolioRequest } from "@/api/generated/mf-portfolio-apis/models/createMFPortfolioRequest";
import type { CreateMFPortfolioResponse } from "@/api/generated/mf-portfolio-apis/models/createMFPortfolioResponse";
import { useCreateMfPortfolioApiMfPortfoliosCreatePost } from "@/api/generated/mf-portfolio-apis/mf-portfolio-apis/mf-portfolio-apis";

/**
 * Context value interface for mutual fund basket builder
 */
export interface MutualFundBasketBuilderContextValue {
  basketConfig: MutualFundBasketConfig;
  updateConfig: <K extends keyof MutualFundBasketConfig>(
    key: K,
    value: MutualFundBasketConfig[K],
  ) => void;
  addFundCategory: (categoryName: string) => void;
  updateFundCategoryPercentage: (categoryName: string, delta: number) => void;
  removeFundCategory: (categoryName: string) => void;
  updateSchemesCount: (categoryName: string, delta: number) => void;
  setCategoryPreference: (
    preferenceId: string,
    categories: FundCategory[],
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
  isCreatingPortfolio: boolean;
  /** Why the last attempt to create the basket failed, until the next one. */
  generationError: string | null;
  portfolioResponse: CreateMFPortfolioResponse | null;
}

// eslint-disable-next-line react-refresh/only-export-components
export const MutualFundBasketBuilderContext = createContext<
  MutualFundBasketBuilderContextValue | undefined
>(undefined);

interface MutualFundBasketBuilderProviderProps {
  children: ReactNode;
}

/**
 * Provider component for mutual fund basket builder state management
 * Manages multi-step form state, navigation, and results display
 */
export function MutualFundBasketBuilderProvider({
  children,
}: MutualFundBasketBuilderProviderProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [portfolioResponse, setPortfolioResponse] =
    useState<CreateMFPortfolioResponse | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [basketConfig, setBasketConfig] = useState<MutualFundBasketConfig>({
    type: "mutualFunds",
    planType: "",
    categoryPreference: "",
    fundCategories: [],
    mfPreferences: "",
  });

  const totalSteps = 4;

  // Initialize create portfolio mutation
  const { mutate: createPortfolio, isPending: isCreatingPortfolio } =
    useCreateMfPortfolioApiMfPortfoliosCreatePost();

  /**
   * Update a single field in basket configuration
   */
  const updateConfig = <K extends keyof MutualFundBasketConfig>(
    key: K,
    value: MutualFundBasketConfig[K],
  ) => {
    setBasketConfig((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Add a fund category with automatic percentage distribution
   */
  const addFundCategory = (categoryName: string) => {
    if (basketConfig.fundCategories.find((c) => c.name === categoryName)) {
      return; // Category already exists
    }

    const newLength = basketConfig.fundCategories.length + 1;
    const equalPercentage = Math.floor(100 / newLength);
    const remainder = 100 - equalPercentage * newLength;

    // Redistribute existing categories equally
    const redistributedCategories = basketConfig.fundCategories.map(
      (cat, index) => ({
        ...cat,
        percentage: equalPercentage + (index === 0 ? remainder : 0),
      }),
    );

    // Add new category with default scheme count of 1
    const newCategory: FundCategory = {
      name: categoryName as FundCategory["name"],
      percentage: equalPercentage,
      schemesCount: 1,
    };

    updateConfig("fundCategories", [...redistributedCategories, newCategory]);
  };

  /**
   * Update fund category percentage with delta (+/- 5)
   */
  const updateFundCategoryPercentage = (
    categoryName: string,
    delta: number,
  ) => {
    const currentIndex = basketConfig.fundCategories.findIndex(
      (cat) => cat.name === categoryName,
    );
    if (currentIndex === -1) return;

    const currentCategory = basketConfig.fundCategories[currentIndex];
    const newPercentage = Math.max(
      5,
      Math.min(95, currentCategory.percentage + delta),
    );
    const actualDelta = newPercentage - currentCategory.percentage;

    if (actualDelta === 0) return;

    const otherCategories = basketConfig.fundCategories.filter(
      (_, index) => index !== currentIndex,
    );

    if (otherCategories.length === 0) return; // Only one category, keep it at 100%

    const totalOtherPercentage = otherCategories.reduce(
      (sum, cat) => sum + cat.percentage,
      0,
    );

    const updatedCategories = basketConfig.fundCategories.map((cat, index) => {
      if (index === currentIndex) {
        return { ...cat, percentage: newPercentage };
      } else {
        const proportion = cat.percentage / totalOtherPercentage;
        const adjustment = actualDelta * proportion;
        return { ...cat, percentage: Math.round(cat.percentage - adjustment) };
      }
    });

    // Ensure sum is exactly 100%
    const currentSum = updatedCategories.reduce(
      (sum, cat) => sum + cat.percentage,
      0,
    );
    if (currentSum !== 100 && otherCategories.length > 0) {
      const diff = 100 - currentSum;
      const firstOtherIndex = updatedCategories.findIndex(
        (_, i) => i !== currentIndex,
      );
      updatedCategories[firstOtherIndex].percentage += diff;
    }

    updateConfig("fundCategories", updatedCategories);
  };

  /**
   * Remove a fund category and redistribute percentages
   */
  const removeFundCategory = (categoryName: string) => {
    const remainingCategories = basketConfig.fundCategories.filter(
      (cat) => cat.name !== categoryName,
    );

    if (remainingCategories.length === 0) {
      updateConfig("fundCategories", []);
      return;
    }

    // Redistribute percentages equally
    const equalPercentage = Math.floor(100 / remainingCategories.length);
    const remainder = 100 - equalPercentage * remainingCategories.length;

    const redistributedCategories = remainingCategories.map((cat, index) => ({
      ...cat,
      percentage: equalPercentage + (index === 0 ? remainder : 0),
    }));

    updateConfig("fundCategories", redistributedCategories);
  };

  /**
   * Update schemes count for a fund category
   */
  const updateSchemesCount = (categoryName: string, delta: number) => {
    const updatedCategories = basketConfig.fundCategories.map((cat) => {
      if (cat.name === categoryName) {
        return {
          ...cat,
          schemesCount: Math.max(0, cat.schemesCount + delta),
        };
      }
      return cat;
    });
    updateConfig("fundCategories", updatedCategories);
  };

  /**
   * Set category preference and apply preset allocation
   */
  const setCategoryPreference = (
    preferenceId: string,
    categories: FundCategory[],
  ) => {
    updateConfig("categoryPreference", preferenceId);
    updateConfig("fundCategories", categories);
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
        return basketConfig.planType !== "";
      case 2:
        return basketConfig.categoryPreference !== "";
      case 3:
        return basketConfig.fundCategories.length > 0;
      case 4:
        return basketConfig.fundCategories.length > 0;
      default:
        return false;
    }
  };

  /**
   * Complete the form and show results
   */
  const handleComplete = () => {
    const request: CreateMFPortfolioRequest = {
      planType: basketConfig.planType as PlanType,
      fundCategories: basketConfig.fundCategories,
    };
    setGenerationError(null);

    createPortfolio(
      { data: request },
      {
        onSuccess: (response) => {
          if (response.status === 200) {
            setPortfolioResponse(response.data);
            setShowResults(true);
            return;
          }
          // The generated fetcher resolves on every status, so a 400/422
          // arrives here as data. Its `detail` is the server's reason (a
          // category with too few schemes, say), which is worth showing as is.
          const detail = (response.data as { detail?: unknown } | null)?.detail;
          setGenerationError(
            typeof detail === "string" && detail
              ? detail
              : "The basket could not be created. Please check your categories and try again.",
          );
        },
        onError: () => {
          setGenerationError("An unexpected error occurred. Please try again.");
        },
      },
    );
  };

  /**
   * Go back to modify the basket configuration
   */
  const handleModify = () => {
    setShowResults(false);
  };

  const restart = () => {
    setShowResults(false);
    setCurrentStep(1);
  };

  const value: MutualFundBasketBuilderContextValue = {
    basketConfig,
    updateConfig,
    addFundCategory,
    updateFundCategoryPercentage,
    removeFundCategory,
    updateSchemesCount,
    setCategoryPreference,
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
    isCreatingPortfolio,
    generationError,
    portfolioResponse,
  };

  return (
    <MutualFundBasketBuilderContext.Provider value={value}>
      {children}
    </MutualFundBasketBuilderContext.Provider>
  );
}
