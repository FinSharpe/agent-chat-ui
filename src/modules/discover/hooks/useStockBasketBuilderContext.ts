import { useContext } from "react";
import { StockBasketBuilderContext } from "../providers/StockBasketBuilderProvider";

/**
 * Hook to access stock basket builder context
 * Must be used within StockBasketBuilderProvider
 */
export function useStockBasketBuilderContext() {
  const context = useContext(StockBasketBuilderContext);
  if (context === undefined) {
    throw new Error(
      "useStockBasketBuilderContext must be used within StockBasketBuilderProvider",
    );
  }
  return context;
}
