"use client";
import { Loader2, Plus, Search, X } from "lucide-react";
import { useSecuritySearch } from "./useSecuritySearch";

/** Search field + suggestion chips shared by both watchlist popups. */
export function SecurityPicker({
  kind,
  query,
  onQueryChange,
  onAdd,
  exclude,
  placeholder,
  compact = false,
}: {
  kind: "stocks" | "mutual-funds";
  query: string;
  onQueryChange: (q: string) => void;
  onAdd: (security: string) => void;
  exclude: string[];
  placeholder: string;
  compact?: boolean;
}) {
  const { suggestions, isSearching, isError } = useSecuritySearch(kind, query);
  const visible = suggestions.filter((s) => !exclude.includes(s.value)).slice(0, compact ? 6 : 8);
  const typed = query.trim();

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          size={compact ? 13 : 14}
          className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${compact ? "left-3" : "left-3.5"}`}
        />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && typed) onAdd(typed);
          }}
          placeholder={placeholder}
          aria-label="Search securities"
          className={`text-forest-deep w-full rounded-full bg-[#EDF3FF]/45 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#063BAA]/20 dark:bg-slate-800/40 dark:text-white ${
            compact ? "py-2.5 pr-16 pl-8.5 text-[11px]" : "py-3 pr-20 pl-9.5 text-[12px]"
          }`}
        />
        {typed && (
          <button
            type="button"
            onClick={() => onAdd(typed)}
            className={`absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-1 rounded-full bg-[#063BAA] font-medium text-white hover:brightness-110 ${
              compact ? "px-2.5 py-1.5 text-[9px]" : "px-3 py-1.5 text-[10px]"
            }`}
          >
            <Plus size={compact ? 10 : 11} /> Add
          </button>
        )}
      </div>

      {visible.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {visible.map((s) => (
            <button
              key={s.value}
              type="button"
              title={s.detail}
              onClick={() => onAdd(s.value)}
              className={`rounded-full bg-[#DFF9EF] font-medium text-[#0A1F4D] transition-colors ${
                compact ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-1.5 text-[10.5px]"
              }`}
            >
              + {s.value}
            </button>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400">
          {isSearching && (
            <Loader2
              size={11}
              className="animate-spin motion-reduce:animate-none"
            />
          )}
          {isSearching
            ? "Searching…"
            : isError
              ? "Search is unavailable — type a ticker and press Add."
              : typed.length >= 2
                ? "No matches — press Add to use it as typed."
                : kind === "stocks"
                  ? "Type to search NSE stocks and ETFs, or enter a ticker."
                  : "Type to search mutual fund schemes."}
        </p>
      )}
    </div>
  );
}

/** Removable chip for a security in a group. */
export function SecurityChip({
  label,
  onRemove,
  size = "md",
}: {
  label: string;
  onRemove: () => void;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`text-forest-deep flex items-center gap-1.5 rounded-full bg-slate-100 py-1.5 pr-1.5 pl-3 font-medium dark:bg-slate-800 dark:text-white ${
        size === "sm" ? "text-[10.5px]" : "text-[11px]"
      }`}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 transition-colors hover:bg-rose-200 dark:bg-slate-700 dark:hover:bg-rose-500/30"
      >
        <X size={9} />
      </button>
    </span>
  );
}
