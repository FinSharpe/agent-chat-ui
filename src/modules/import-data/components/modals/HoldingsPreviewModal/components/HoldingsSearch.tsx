"use client";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search, X } from "lucide-react";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import {
  StockSearchResponse,
  MutualFundSearchResponse,
} from "@/types/search-api.types";
import { useHoldingsSearch } from "../hooks/useHoldingsSearch";
import { getAssetTypeName } from "../utils/holdings-transformer";

type SearchResult =
  | StockSearchResponse["results"][0]
  | MutualFundSearchResponse["results"][0];

type HoldingsSearchProps = {
  /** Consent type to determine search endpoint and display */
  consentType: ConsentType;
  /** Callback when a search result is selected */
  onSelectResult: (result: SearchResult) => void;
};

/**
 * Search-and-add control for holdings. The results render as an absolutely
 * positioned overlay so opening them never reflows the table beneath.
 */
export function HoldingsSearch({
  consentType,
  onSelectResult,
}: HoldingsSearchProps) {
  const { searchQuery, setSearchQuery, searchResults, isSearching, error } =
    useHoldingsSearch(consentType);

  const assetType = getAssetTypeName(consentType).toLowerCase();

  const handleSelectResult = (result: SearchResult) => {
    onSelectResult(result);
    setSearchQuery("");
  };

  const showOverlay =
    searchQuery.trim().length > 0 &&
    (!!searchResults || (!!error && !isSearching));

  return (
    <div className="relative">
      <div className="relative">
        <Search className="text-text-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          aria-label={`Search ${assetType}s to add`}
          placeholder={`Search ${assetType}s to add…`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 pr-10 pl-10"
        />
        {isSearching ? (
          <Loader2 className="text-text-muted absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
        ) : (
          searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="text-text-muted hover:text-text-secondary focus-visible:ring-ring absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          )
        )}
      </div>

      {showOverlay && (
        <div className="border-border bg-popover absolute top-[calc(100%+0.375rem)] right-0 left-0 z-20 overflow-hidden rounded-xl border shadow-lg">
          {searchResults && searchResults.length > 0 ? (
            <ul className="scrollbar-thin max-h-64 overflow-y-auto">
              {searchResults.map((result, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className="group border-border-subtle hover:bg-bg-hover focus-visible:bg-bg-hover flex w-full items-center gap-3 border-b px-3 py-2.5 text-left transition-colors last:border-b-0 focus-visible:outline-none"
                  >
                    <div className="min-w-0 flex-1">
                      {"symbol" in result ? (
                        <>
                          <div className="text-text-primary truncate text-sm font-medium">
                            {result.symbol}
                          </div>
                          <div className="text-text-tertiary truncate text-xs">
                            {result.compname}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-text-primary truncate text-sm font-medium">
                            {result.sName}
                          </div>
                          <div className="text-text-tertiary truncate text-xs">
                            {result.legalNames}
                          </div>
                        </>
                      )}
                    </div>
                    <span className="bg-secondary text-secondary-foreground group-hover:bg-brand-teal inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:text-white">
                      <Plus className="h-4 w-4" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : error ? (
            <div className="text-error-fg px-4 py-6 text-center text-sm">
              Search failed. Please try again.
            </div>
          ) : (
            <div className="text-text-tertiary px-4 py-6 text-center text-sm">
              No results for &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
