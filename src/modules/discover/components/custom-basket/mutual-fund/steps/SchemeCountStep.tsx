"use client";

import { useMutualFundBasketBuilderContext } from "../../../../hooks/useMutualFundBasketBuilderContext";
import { StepHeading } from "../../shared/StepHeading";
import { Stepper } from "../../shared/Stepper";

/**
 * Fund flow, schemes per category: how many funds fill each category's
 * weight. The last step — the wizard's footer turns into "Create My Basket".
 */
export function SchemeCountStep() {
  const { basketConfig, updateSchemesCount } =
    useMutualFundBasketBuilderContext();
  const categories = basketConfig.fundCategories;
  const total = categories.reduce((sum, cat) => sum + cat.schemesCount, 0);
  const invalid = categories.filter((cat) => cat.schemesCount < 1);

  return (
    <>
      <StepHeading
        title="Schemes per Category"
        status={
          categories.length > 0 && invalid.length === 0
            ? `${total} ${total === 1 ? "scheme" : "schemes"}`
            : undefined
        }
        hint="The weight of each category is split evenly across its schemes."
      />

      {categories.length > 0 && (
        <div className="glass-card rounded-nested mt-3 divide-y divide-slate-100 overflow-hidden dark:divide-slate-800/60">
          {categories.map((category) => (
            <div
              key={category.name}
              className="flex items-center gap-3 px-4.5 py-3.5"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-geist truncate text-[13px] font-medium text-[#0A1F4D] dark:text-white">
                  {category.name}
                </p>
                <p className="text-[10px] text-slate-400">
                  {category.percentage}% allocation
                </p>
              </div>
              <Stepper
                value={`${category.schemesCount}`}
                label={`${category.name} schemes`}
                onDecrement={() => updateSchemesCount(category.name, -1)}
                onIncrement={() => updateSchemesCount(category.name, 1)}
                canDecrement={category.schemesCount > 1}
              />
            </div>
          ))}
        </div>
      )}

      {invalid.length > 0 && (
        <p className="mt-3 text-[11px] text-amber-600">
          Each category needs at least one scheme:{" "}
          {invalid.map((cat) => cat.name).join(", ")}.
        </p>
      )}
    </>
  );
}
