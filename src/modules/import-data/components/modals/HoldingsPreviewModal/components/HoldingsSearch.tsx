"use client";
import { Loader2, Search, X } from "lucide-react";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import {
  StockSearchResponse,
  MutualFundSearchResponse,
} from "@/types/search-api.types";
import { useHoldingsSearch } from "../hooks/useHoldingsSearch";
import { holdingNoun } from "../utils/holding-value";

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
 * Search-and-add control in the reference "Add Securities" style: a rounded
 * tinted search field, results offered as mint "+ NAME" chips underneath.
 */
export function HoldingsSearch({
  consentType,
  onSelectResult,
}: HoldingsSearchProps) {
  const { searchQuery, setSearchQuery, searchResults, isSearching, error } =
    useHoldingsSearch(consentType);

  const noun = holdingNoun(consentType, 2);
  const hasQuery = searchQuery.trim().length > 0;

  const handleSelectResult = (result: SearchResult) => {
    onSelectResult(result);
    setSearchQuery("");
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
        />
        <input
          aria-label={`Search ${noun} to add`}
          placeholder={`Search ${noun} to add`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            // Enter must not submit the surrounding import form.
            if (e.key === "Enter") e.preventDefault();
          }}
          className="text-forest-deep w-full rounded-full bg-[#EDF3FF]/45 py-3 pr-10 pl-9.5 text-[12px] outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#063BAA]/20 dark:bg-slate-800/40 dark:text-white"
        />
        {isSearching ? (
          <Loader2
            size={14}
            className="absolute top-1/2 right-3.5 -translate-y-1/2 animate-spin text-slate-400"
          />
        ) : (
          hasQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={13} />
            </button>
          )
        )}
      </div>

      {hasQuery && !isSearching && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {searchResults && searchResults.length > 0 ? (
            searchResults.map((result, idx) => {
              const isStock = "symbol" in result;
              const label = isStock ? result.symbol : result.sName;
              const detail = isStock ? result.compname : result.legalNames;
              return (
                <button
                  key={idx}
                  type="button"
                  title={detail}
                  onClick={() => handleSelectResult(result)}
                  className="max-w-[260px] truncate rounded-full bg-[#DFF9EF] px-3 py-1.5 text-[10.5px] font-medium text-[#0A1F4D] transition-colors"
                >
                  + {label}
                </button>
              );
            })
          ) : error ? (
            <p className="text-[11px] text-rose-500">
              Search failed. Please try again.
            </p>
          ) : searchResults ? (
            <p className="text-[11px] text-slate-400">
              No results for &ldquo;{searchQuery}&rdquo;
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
