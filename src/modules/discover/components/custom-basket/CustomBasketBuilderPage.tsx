"use client";

import { BasketBuilderProvider } from "../../providers/BasketBuilderProvider";
import { StockBasketBuilderProvider } from "../../providers/StockBasketBuilderProvider";
import { MutualFundBasketBuilderProvider } from "../../providers/MutualFundBasketBuilderProvider";
import { useBasketBuilderContext } from "../../hooks/useBasketBuilderContext";
import { useStockBasketBuilderContext } from "../../hooks/useStockBasketBuilderContext";
import { useMutualFundBasketBuilderContext } from "../../hooks/useMutualFundBasketBuilderContext";
import { BasketBuilderWizard } from "./BasketBuilderWizard";
import { MutualFundBasketResults } from "./mutual-fund/MutualFundBasketResults";
import { StockBasketResults } from "./stock/StockBasketResults";
import { FeatureFrame } from "./shared/FeatureFrame";

/**
 * The wizard, or the basket it generated — swapped in place, as the reference
 * builder does once "Create My Basket" succeeds.
 */
function BasketBuilderContent() {
  const { investmentType } = useBasketBuilderContext();
  const stock = useStockBasketBuilderContext();
  const fund = useMutualFundBasketBuilderContext();

  if (investmentType === "stocks" && stock.showResults) {
    return <StockBasketResults />;
  }
  if (investmentType === "mutualFunds" && fund.showResults) {
    return <MutualFundBasketResults />;
  }
  return <BasketBuilderWizard />;
}

/**
 * Build Your Own Portfolios (`/discover/create-basket`).
 *
 * Both flows' providers are mounted for the whole page rather than only once
 * their flow is chosen, so stepping back to the first question — or across to
 * the other flow and back — keeps every answer already given.
 */
export function CustomBasketBuilderPage() {
  return (
    <BasketBuilderProvider>
      <StockBasketBuilderProvider>
        <MutualFundBasketBuilderProvider>
          <FeatureFrame>
            <BasketBuilderContent />
          </FeatureFrame>
        </MutualFundBasketBuilderProvider>
      </StockBasketBuilderProvider>
    </BasketBuilderProvider>
  );
}
