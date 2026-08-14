"use client";

import { Loader2, Search } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStockSearch } from "../../hooks/usePipelineQueries";

/**
 * The target picker, over the existing stock search.
 *
 * Deliberately inline rather than a modal: choosing the stock *is* the first
 * step of buying a report, and a dialog would put a lid on the thing the page
 * exists to do.
 *
 * The results overlay the page rather than pushing it down. A field that grows
 * a panel in flow shoves everything under it as you type, which makes the
 * primary control feel unstable — and on the catalog panel it would reflow the
 * whole product card on every keystroke.
 */
export function StockPicker({
  onSelect,
  autoFocus = false,
  selectedSymbol,
  size = "default",
}: {
  onSelect: (symbol: string) => void;
  autoFocus?: boolean;
  selectedSymbol?: string | null;
  /** `lg` is the catalog's primary action; `default` is a field on a form. */
  size?: "default" | "lg";
}) {
  const [query, setQuery] = useState("");
  const { results, isSearching, isPending, error } = useStockSearch(query);
  const showResults = query.trim().length >= 2;
  const large = size === "lg";

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className={cn(
            "text-text-muted pointer-events-none absolute top-1/2 -translate-y-1/2",
            large ? "left-3.5 size-5" : "left-3 size-4",
          )}
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a stock — name or symbol"
          className={cn(
            // The shared Input leaves `--input` transparent in light mode and
            // draws no focus ring, so a bare field has no edge at all — the
            // reason this one read as part of the background. Both are given
            // back here rather than in the shared component, which the rest of
            // the app relies on as it stands.
            "border-border-default focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]",
            large ? "h-12 pl-11 text-base md:text-base" : "pl-9",
          )}
          autoFocus={autoFocus}
          aria-label="Search a stock"
        />
        {(isSearching || isPending) && showResults && (
          <Loader2
            className={cn(
              "text-text-muted absolute top-1/2 -translate-y-1/2 animate-spin",
              large ? "right-3.5 size-5" : "right-3 size-4",
            )}
          />
        )}
      </div>

      {showResults && (
        <div className="border-border-default bg-bg-card absolute top-full right-0 left-0 z-30 mt-2 max-h-80 overflow-y-auto rounded-lg border shadow-lg">
          {error ? (
            <p className="text-error-fg px-4 py-6 text-center text-sm">
              Search is unavailable right now.
            </p>
          ) : results.length === 0 && !isSearching && !isPending ? (
            <p className="text-text-tertiary px-4 py-6 text-center text-sm">
              No stock matches “{query.trim()}”.
            </p>
          ) : (
            <ul>
              {results.map((result) => (
                <li key={result.fincode}>
                  <button
                    type="button"
                    onClick={() => onSelect(result.symbol)}
                    className={cn(
                      "hover:bg-bg-hover flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors",
                      selectedSymbol === result.symbol && "bg-bg-hover",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="text-text-primary block truncate text-sm font-medium">
                        {result.compname}
                      </span>
                      <span className="text-text-tertiary block text-xs">
                        {result.symbol}
                      </span>
                    </span>
                    <span className="text-text-tertiary text-xs">Select</span>
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
