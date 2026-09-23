"use client";

import { StockPicker } from "../catalog/StockPicker";
import { Label } from "../shared/kit";

/**
 * Which stock a stock Pipeline is about: the picker until one is chosen,
 * then the choice with a way to change it. The resolved symbol is the
 * server's — shown beside the typed one when they differ, so a reader sees
 * what the report will actually cover before paying for it.
 */
export function TargetField({
  symbol,
  resolvedSymbol,
  onSelect,
  onClear,
}: {
  symbol: string | null;
  resolvedSymbol?: string;
  onSelect: (symbol: string) => void;
  onClear: () => void;
}) {
  return (
    <section className="space-y-2.5">
      <Label>Stock</Label>
      {symbol ? (
        <div className="glass-card rounded-nested flex items-center justify-between gap-3 px-4.5 py-3.5">
          <div className="min-w-0">
            <p className="font-geist truncate text-[13px] font-medium text-[#0A1F4D] dark:text-white">
              {symbol}
            </p>
            <p className="text-[10px] text-slate-400">
              {resolvedSymbol && resolvedSymbol !== symbol
                ? `Resolved to ${resolvedSymbol}`
                : "The report will be about this stock"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium text-[#063BAA] transition-colors hover:bg-[#063BAA]/[0.06]"
          >
            Change
          </button>
        </div>
      ) : (
        <StockPicker
          autoFocus
          onSelect={onSelect}
        />
      )}
    </section>
  );
}
