"use client";

export type ImportView = "networth" | "watchlist";

const LABELS: Record<ImportView, string> = {
  networth: "My Net Worth",
  watchlist: "Watchlist",
};

/**
 * My Net Worth / Watchlist switch — the reference's segmented pill (it hides
 * it until its watchlist is live; here the watchlist works, so it shows).
 */
export function ImportViewToggle({
  value,
  onChange,
}: {
  value: ImportView;
  onChange: (view: ImportView) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Import view"
      className="glass-tile flex w-full shrink-0 items-center gap-1 rounded-full p-1 select-none"
    >
      {(Object.keys(LABELS) as ImportView[]).map((v) => {
        const active = value === v;
        return (
          <button
            key={v}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={`flex-1 rounded-full py-2 text-center text-[11px] font-medium transition-all ${
              active
                ? "bg-[#063BAA] text-white shadow-xs"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {LABELS[v]}
          </button>
        );
      })}
    </div>
  );
}
