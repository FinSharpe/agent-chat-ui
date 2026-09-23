import { useContext } from "react";
import { MutualFundBasketBuilderContext } from "../providers/MutualFundBasketBuilderProvider";

/**
 * Hook to access mutual fund basket builder context
 * Must be used within MutualFundBasketBuilderProvider
 */
export function useMutualFundBasketBuilderContext() {
  const context = useContext(MutualFundBasketBuilderContext);
  if (context === undefined) {
    throw new Error(
      "useMutualFundBasketBuilderContext must be used within MutualFundBasketBuilderProvider",
    );
  }
  return context;
}
