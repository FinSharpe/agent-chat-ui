"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";

import { useGetSebiCategoriesApiMfPortfoliosSebiCategoriesGet } from "@/api/generated/mf-portfolio-apis/mf-portfolio-apis/mf-portfolio-apis";
import { useMutualFundBasketBuilderContext } from "../../../../hooks/useMutualFundBasketBuilderContext";
import { StepHeading } from "../../shared/StepHeading";
import { Stepper } from "../../shared/Stepper";

/**
 * Fund flow, category allocation: the chosen SEBI categories with a weight
 * each, in 5% steps. The provider rebalances the others on every change, so
 * the total is always 100% — the step never has to ask the reader to fix a
 * sum.
 */
export function FundCategoriesStep() {
  const {
    basketConfig,
    addFundCategory,
    updateFundCategoryPercentage,
    removeFundCategory,
  } = useMutualFundBasketBuilderContext();
  const [adding, setAdding] = useState(false);

  // The category list is the screener's own, so the builder can only ever
  // ask for a category the backend can fill.
  const { data, isLoading, isError } =
    useGetSebiCategoriesApiMfPortfoliosSebiCategoriesGet();
  const categories = basketConfig.fundCategories;
  const available = (data?.data.categories ?? []).filter(
    (name) => !categories.some((category) => category.name === name),
  );

  return (
    <>
      <StepHeading
        title="Category Allocation"
        status={
          categories.length > 0
            ? `100% across ${categories.length} ${categories.length === 1 ? "category" : "categories"}`
            : undefined
        }
        hint="Adjust each category in 5% steps — the others rebalance so the basket always adds up to 100%."
      />

      {categories.length > 0 && (
        <div className="glass-card rounded-nested mt-3 divide-y divide-slate-100 overflow-hidden dark:divide-slate-800/60">
          {categories.map((category) => (
            <div
              key={category.name}
              className="flex items-center gap-3 px-4.5 py-3.5"
            >
              <p className="font-geist min-w-0 flex-1 truncate text-[13px] font-medium text-[#0A1F4D] dark:text-white">
                {category.name}
              </p>
              <Stepper
                value={`${category.percentage}%`}
                label={`${category.name} weight`}
                onDecrement={() =>
                  updateFundCategoryPercentage(category.name, -5)
                }
                onIncrement={() =>
                  updateFundCategoryPercentage(category.name, 5)
                }
                // A lone category holds the whole basket, so there is
                // nothing to move its weight to.
                canDecrement={categories.length > 1 && category.percentage > 5}
                canIncrement={categories.length > 1 && category.percentage < 95}
              />
              <button
                type="button"
                onClick={() => removeFundCategory(category.name)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                aria-label={`Remove ${category.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {categories.length === 0 && !isLoading && (
        <p className="mt-3 text-[11px] text-amber-600">
          Add at least one fund category to continue.
        </p>
      )}

      <div className="relative mt-3">
        {isLoading ? (
          <p className="flex items-center gap-2 px-1 text-[11px] text-slate-400">
            <Loader2
              size={13}
              className="animate-spin"
            />
            Loading categories…
          </p>
        ) : isError ? (
          <p className="px-1 text-[11px] text-rose-500">
            The fund categories could not be loaded. Please try again.
          </p>
        ) : (
          available.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setAdding((open) => !open)}
                aria-expanded={adding}
                className="glass-tile flex w-full items-center justify-between rounded-full px-4 py-3 text-sm text-[#0A1F4D]/60"
              >
                Add a category
                <Plus
                  size={15}
                  className="text-[#063BAA]"
                />
              </button>
              {adding && (
                <>
                  {/* Closes the list on an outside click. */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setAdding(false)}
                  />
                  <ul className="glass-card rounded-nested absolute top-full right-0 left-0 z-20 mt-2 max-h-60 divide-y divide-slate-100 overflow-y-auto shadow-[0_18px_40px_-18px_rgba(10,31,77,0.35)] dark:divide-slate-800/60">
                    {available.map((name) => (
                      <li key={name}>
                        <button
                          type="button"
                          onClick={() => {
                            addFundCategory(name);
                            setAdding(false);
                          }}
                          className="w-full px-4 py-3 text-left text-[12px] text-[#0A1F4D] transition-colors hover:bg-[#063BAA]/[0.04] dark:text-white"
                        >
                          {name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )
        )}
      </div>
    </>
  );
}
