"use client";

import { investmentStyleOptions } from "../../../../constants/stock-basket-data";
import { useStockBasketBuilderContext } from "../../../../hooks/useStockBasketBuilderContext";
import { OptionCard } from "../../shared/OptionCard";
import { OPTION_LIST, StepHeading } from "../../shared/StepHeading";

/**
 * Stock flow, investment style: growth, value, momentum or quality — the
 * factor the backend sorts the universe by.
 */
export function InvestmentStyleStep() {
  const { basketConfig, updateConfig } = useStockBasketBuilderContext();

  return (
    <>
      <StepHeading title="Investment Style" />
      <div className={OPTION_LIST}>
        {investmentStyleOptions.map((option) => (
          <OptionCard
            key={option.id}
            title={option.name}
            description={option.description}
            selected={basketConfig.investmentStyle === option.id}
            onClick={() => updateConfig("investmentStyle", option.id)}
          />
        ))}
      </div>
    </>
  );
}
