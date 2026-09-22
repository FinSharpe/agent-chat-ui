"use client";

import { portfolioSizeOptions } from "../../../../constants/stock-basket-data";
import { useStockBasketBuilderContext } from "../../../../hooks/useStockBasketBuilderContext";
import { OptionCard } from "../../shared/OptionCard";
import { OPTION_LIST, StepHeading } from "../../shared/StepHeading";

/**
 * Stock flow, portfolio size: concentrated (15), diversified (25), or a
 * number of the reader's own.
 */
export function PortfolioSizeStep() {
  const { basketConfig, updateConfig } = useStockBasketBuilderContext();

  const select = (id: string, stockCount: string) => {
    updateConfig("portfolioSize", id);
    if (id !== "custom") updateConfig("customStockCount", stockCount);
  };

  return (
    <>
      <StepHeading title="Portfolio Size" />
      <div className={OPTION_LIST}>
        {portfolioSizeOptions.map((option) => (
          <OptionCard
            key={option.id}
            title={option.name}
            description={option.description}
            selected={basketConfig.portfolioSize === option.id}
            onClick={() => select(option.id, option.stockCount || "")}
          />
        ))}
      </div>

      {basketConfig.portfolioSize === "custom" && (
        <div className="mt-3 space-y-1.5">
          <input
            type="number"
            min={1}
            max={50}
            inputMode="numeric"
            value={basketConfig.customStockCount}
            onChange={(event) =>
              updateConfig("customStockCount", event.target.value)
            }
            placeholder="Number of stocks"
            aria-label="Number of stocks"
            autoFocus
            className="glass-tile w-full rounded-full px-4 py-3 text-sm text-[#0A1F4D] placeholder-[#0A1F4D]/50 focus:outline-none"
          />
          <p className="px-4 text-[10px] text-slate-400">
            Choose between 1 and 50 stocks
          </p>
        </div>
      )}
    </>
  );
}
