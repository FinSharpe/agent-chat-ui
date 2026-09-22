"use client";

import { portfolioAllocationOptions } from "../../../../constants/stock-basket-data";
import { useStockBasketBuilderContext } from "../../../../hooks/useStockBasketBuilderContext";
import { OptionCard } from "../../shared/OptionCard";
import { OPTION_LIST, StepHeading } from "../../shared/StepHeading";

/**
 * Stock flow, allocation: how the weight is spread across the chosen stocks.
 * The last step — the wizard's footer turns into "Create My Basket" here.
 *
 * Each option keeps its one-line explanation (the reference shows titles
 * only): the four names alone do not say how the weight moves.
 */
export function PortfolioAllocationStep() {
  const { basketConfig, updateConfig } = useStockBasketBuilderContext();

  return (
    <>
      <StepHeading title="Portfolio Allocation" />
      <div className={OPTION_LIST}>
        {portfolioAllocationOptions.map((option) => (
          <OptionCard
            key={option.id}
            title={option.name}
            description={option.description}
            selected={basketConfig.portfolioAllocation === option.id}
            onClick={() => updateConfig("portfolioAllocation", option.id)}
          />
        ))}
      </div>
    </>
  );
}
