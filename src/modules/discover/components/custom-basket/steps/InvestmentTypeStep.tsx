"use client";

import { investmentTypeOptions } from "../../../constants/basket-wizard-data";
import { useBasketBuilderContext } from "../../../hooks/useBasketBuilderContext";
import { OptionCard } from "../shared/OptionCard";
import { OPTION_LIST, StepHeading } from "../shared/StepHeading";

/**
 * Step 1: stocks or mutual funds. The choice is only highlighted here —
 * Continue commits it and opens that flow.
 */
export function InvestmentTypeStep() {
  const { selectedType, setSelectedType } = useBasketBuilderContext();

  return (
    <>
      <StepHeading title="Investment Type" />
      <div className={OPTION_LIST}>
        {investmentTypeOptions.map((option) => (
          <OptionCard
            key={option.id}
            title={option.name}
            description={option.description}
            selected={selectedType === option.id}
            onClick={() => setSelectedType(option.id)}
          />
        ))}
      </div>
    </>
  );
}
