import { useContext } from "react";
import { BasketBuilderContext } from "../providers/BasketBuilderProvider";

/**
 * Hook to access basket builder orchestrator context
 * Must be used within BasketBuilderProvider
 */
export function useBasketBuilderContext() {
  const context = useContext(BasketBuilderContext);

  if (context === undefined) {
    throw new Error(
      "useBasketBuilderContext must be used within BasketBuilderProvider",
    );
  }

  return context;
}
