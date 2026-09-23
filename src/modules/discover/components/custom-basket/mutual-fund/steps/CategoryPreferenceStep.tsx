"use client";

import { cn } from "@/lib/utils";
import { categoryPreferenceOptions } from "../../../../constants/mutual-fund-basket-data";
import { useMutualFundBasketBuilderContext } from "../../../../hooks/useMutualFundBasketBuilderContext";
import { OptionCard } from "../../shared/OptionCard";
import { OPTION_LIST, StepHeading } from "../../shared/StepHeading";

/**
 * Fund flow, category preference: a preset allocation to start from, or an
 * empty one to build. Each preset lists the split it applies, so the next
 * step holds no surprises.
 */
export function CategoryPreferenceStep() {
  const { basketConfig, setCategoryPreference } =
    useMutualFundBasketBuilderContext();

  return (
    <>
      <StepHeading title="Category Preference" />
      <div className={OPTION_LIST}>
        {categoryPreferenceOptions.map((option) => {
          const selected = basketConfig.categoryPreference === option.id;
          return (
            <OptionCard
              key={option.id}
              title={option.name}
              description={option.description}
              selected={selected}
              onClick={() =>
                setCategoryPreference(option.id, option.categories)
              }
            >
              {option.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1.5">
                  {option.categories.map((category) => (
                    <span
                      key={category.name}
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        selected
                          ? "bg-white/15 text-white"
                          : "bg-[#063BAA]/8 text-[#063BAA]",
                      )}
                    >
                      {category.name} · {category.percentage}%
                    </span>
                  ))}
                </div>
              )}
            </OptionCard>
          );
        })}
      </div>
    </>
  );
}
