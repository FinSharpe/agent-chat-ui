"use client";

import type { MarketCap } from "@/api/generated/portfolio-apis/models";
import { marketCapOptions } from "../../../../constants/stock-basket-data";
import { useStockBasketBuilderContext } from "../../../../hooks/useStockBasketBuilderContext";
import { OptionCard } from "../../shared/OptionCard";
import { OPTION_LIST, StepHeading } from "../../shared/StepHeading";

const RANGE_MIN = 100;
const RANGE_MAX = 50000;
const RANGE_STEP = 100;

function formatMarketCap(value: number): string {
  return value >= 1000 ? `₹${(value / 1000).toFixed(0)}k Cr` : `₹${value} Cr`;
}

/**
 * Stock flow, market cap: any mix of the three bands, or a custom crore
 * range. The range and the bands are exclusive — the API reads a custom range
 * in place of the bands — so choosing one clears the other.
 */
export function MarketCapStep() {
  const { basketConfig, updateConfig } = useStockBasketBuilderContext();
  const caps = basketConfig.marketCap;
  const isCustom = caps.includes("custom");
  const [low, high] = basketConfig.customMarketCapRange;

  const toggle = (id: MarketCap | "custom") => {
    if (id === "custom") {
      updateConfig("marketCap", isCustom ? [] : ["custom"]);
      return;
    }
    const bands = caps.filter((cap) => cap !== "custom") as MarketCap[];
    updateConfig(
      "marketCap",
      bands.includes(id) ? bands.filter((cap) => cap !== id) : [...bands, id],
    );
  };

  return (
    <>
      <StepHeading
        title="Market Cap"
        status={
          caps.length > 0
            ? isCustom
              ? "Custom range"
              : `${caps.length} selected`
            : undefined
        }
      />
      <div className={OPTION_LIST}>
        {marketCapOptions.map((option) => (
          <OptionCard
            key={option.id}
            title={option.name}
            description={option.description}
            selected={caps.includes(option.id)}
            onClick={() => toggle(option.id)}
          />
        ))}
      </div>

      {isCustom && (
        <div className="glass-card rounded-nested mt-3 space-y-4 p-4.5">
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
              Market Cap Range
            </p>
            <p className="font-geist text-sm font-medium text-[#0A1F4D] tabular-nums">
              {formatMarketCap(low)} – {formatMarketCap(high)}
            </p>
          </div>
          <label className="block space-y-1.5">
            <span className="text-[10px] text-slate-400">
              Minimum · {formatMarketCap(low)}
            </span>
            <input
              type="range"
              min={RANGE_MIN}
              max={RANGE_MAX}
              step={RANGE_STEP}
              value={low}
              onChange={(event) => {
                const next = parseInt(event.target.value);
                if (next < high)
                  updateConfig("customMarketCapRange", [next, high]);
              }}
              className="w-full cursor-pointer accent-[#063BAA]"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[10px] text-slate-400">
              Maximum · {formatMarketCap(high)}
            </span>
            <input
              type="range"
              min={RANGE_MIN}
              max={RANGE_MAX}
              step={RANGE_STEP}
              value={high}
              onChange={(event) => {
                const next = parseInt(event.target.value);
                if (next > low)
                  updateConfig("customMarketCapRange", [low, next]);
              }}
              className="w-full cursor-pointer accent-[#063BAA]"
            />
          </label>
        </div>
      )}
    </>
  );
}
