"use client";

import { ArrowRight, Loader2, Search } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { useStockSearch } from "../../hooks/usePipelineQueries";

/**
 * The target picker, over the existing stock search.
 *
 * Deliberately inline rather than a modal: choosing the stock *is* the first
 * step of buying a report, and a dialog would put a lid on the thing the
 * screen exists to do.
 *
 * The results overlay what follows rather than pushing it down. A field that
 * grows a panel in flow shoves everything under it as you type, which makes
 * the primary control feel unstable.
 */
export function StockPicker({
  onSelect,
  autoFocus = false,
  selectedSymbol,
}: {
  onSelect: (symbol: string) => void;
  autoFocus?: boolean;
  selectedSymbol?: string | null;
}) {
  const [query, setQuery] = useState("");
  const { results, isSearching, isPending, error } = useStockSearch(query);
  const showResults = query.trim().length >= 2;

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a stock — name or symbol"
          autoFocus={autoFocus}
          aria-label="Search a stock"
          className="glass-tile w-full rounded-full py-3 pr-10 pl-10 text-sm text-[#0A1F4D] placeholder-[#0A1F4D]/50 focus:ring-2 focus:ring-[#063BAA]/20 focus:outline-none"
        />
        {(isSearching || isPending) && showResults && (
          <Loader2
            size={15}
            className="absolute top-1/2 right-4 -translate-y-1/2 animate-spin text-slate-400"
          />
        )}
      </div>

      {showResults && (
        <div className="glass-card rounded-nested absolute top-full right-0 left-0 z-30 mt-2 max-h-72 overflow-y-auto shadow-[0_18px_40px_-18px_rgba(10,31,77,0.35)]">
          {error ? (
            <p className="px-4 py-6 text-center text-[11px] text-rose-500">
              Search is unavailable right now.
            </p>
          ) : results.length === 0 && !isSearching && !isPending ? (
            <p className="px-4 py-6 text-center text-[11px] text-slate-400">
              No stock matches “{query.trim()}”.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {results.map((result) => (
                <li key={result.fincode}>
                  <button
                    type="button"
                    onClick={() => onSelect(result.symbol)}
                    className={cn(
                      "flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-[#063BAA]/[0.04]",
                      selectedSymbol === result.symbol && "bg-[#063BAA]/[0.04]",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-medium text-[#0A1F4D] dark:text-white">
                        {result.compname}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {result.symbol}
                      </span>
                    </span>
                    <ArrowRight
                      size={14}
                      className="shrink-0 text-slate-300"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
