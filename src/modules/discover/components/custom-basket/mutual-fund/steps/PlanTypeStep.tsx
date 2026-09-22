"use client";

import { planTypeOptions } from "../../../../constants/mutual-fund-basket-data";
import { useMutualFundBasketBuilderContext } from "../../../../hooks/useMutualFundBasketBuilderContext";
import { OptionCard } from "../../shared/OptionCard";
import { OPTION_LIST, StepHeading } from "../../shared/StepHeading";

/** Fund flow, plan type: direct or regular. */
export function PlanTypeStep() {
  const { basketConfig, updateConfig } = useMutualFundBasketBuilderContext();

  return (
    <>
      <StepHeading title="Plan Type" />
      <div className={OPTION_LIST}>
        {planTypeOptions.map((option) => (
          <OptionCard
            key={option.id}
            title={option.name}
            description={option.description}
            selected={basketConfig.planType === option.id}
            onClick={() => updateConfig("planType", option.id)}
          />
        ))}
      </div>
    </>
  );
}
