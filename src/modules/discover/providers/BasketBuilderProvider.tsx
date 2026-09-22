"use client";

import { createContext, ReactNode, useState } from "react";
import type { InvestmentType } from "../types/basket-builder.types";

/**
 * Context value interface for basket builder orchestrator
 * Only manages investment type selection
 */
export interface BasketBuilderContextValue {
  /** The flow the builder is in; empty while on the first step. */
  investmentType: InvestmentType;
  setInvestmentType: (type: InvestmentType) => void;
  /** Back to the first step. The choice stays selected there, and each
   *  flow's own answers are kept, so Continue picks up where it left off. */
  resetInvestmentType: () => void;
  /** The option highlighted on the first step, before Continue commits it. */
  selectedType: InvestmentType;
  setSelectedType: (type: InvestmentType) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const BasketBuilderContext = createContext<
  BasketBuilderContextValue | undefined
>(undefined);

interface BasketBuilderProviderProps {
  children: ReactNode;
}

/**
 * Orchestrator provider for basket builder
 * Manages only the investment type selection (stocks vs mutual funds)
 * Actual basket configuration is handled by separate providers
 */
export function BasketBuilderProvider({
  children,
}: BasketBuilderProviderProps) {
  const [investmentType, setInvestmentTypeState] = useState<InvestmentType>("");
  const [selectedType, setSelectedType] = useState<InvestmentType>("");

  const setInvestmentType = (type: InvestmentType) => {
    setInvestmentTypeState(type);
    if (type) setSelectedType(type);
  };

  const resetInvestmentType = () => {
    setInvestmentTypeState("");
  };

  const value: BasketBuilderContextValue = {
    investmentType,
    setInvestmentType,
    resetInvestmentType,
    selectedType,
    setSelectedType,
  };

  return (
    <BasketBuilderContext.Provider value={value}>
      {children}
    </BasketBuilderContext.Provider>
  );
}
