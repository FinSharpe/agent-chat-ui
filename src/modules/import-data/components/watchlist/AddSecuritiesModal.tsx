"use client";
import { OverlayRoot } from "@/components/shared/Popup";
import { X } from "lucide-react";
import { useState } from "react";
import { WATCHLIST_GROUP_NAME_MAX, type WatchlistCard } from "../../constants/watchlist";
import { SecurityChip, SecurityPicker } from "./SecurityPicker";

/**
 * Build a named group of securities for one watchlist card: search (or type a
 * ticker), collect chips, name the group, save. A full-screen sheet on
 * mobile, a popup on desktop — the reference's AddSecuritiesModal.
 */
export function AddSecuritiesModal({
  card,
  onClose,
  onSave,
}: {
  card: WatchlistCard;
  onClose: () => void;
  onSave: (groupName: string, securities: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  const add = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || selected.includes(trimmed)) return;
    setSelected((s) => [...s, trimmed]);
    setQuery("");
  };

  const canSave = groupName.trim().length > 0 && selected.length > 0;
  const label = "block text-[10px] font-medium tracking-wider text-slate-400 uppercase";

  return (
    <OverlayRoot
      onClose={onClose}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="font-funnel text-forest-deep absolute inset-0 z-50 flex flex-col overflow-hidden bg-white dark:bg-[#0C1524] dark:text-white"
    >
      <div className="flex h-[56px] shrink-0 items-center justify-between border-b border-slate-50 bg-white px-5 dark:border-slate-800/40 dark:bg-[#0C1524]">
        <div className="flex flex-col">
          <h2 className="text-xs font-medium tracking-wider text-[#063BAA] uppercase dark:text-[#8FB4FF]">
            Add Securities
          </h2>
          <span className="mt-0.5 text-[9.5px] leading-none font-medium text-slate-400">
            {card.name}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="hover-tint flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-slate-400 transition-colors dark:border-slate-800"
        >
          <X size={16} />
        </button>
      </div>

      <div className="scrollbar-none flex-1 space-y-5 overflow-y-auto p-5 pb-32">
        <div className="space-y-2">
          <span className={label}>Search Securities</span>
          <SecurityPicker
            kind={card.search}
            query={query}
            onQueryChange={setQuery}
            onAdd={add}
            exclude={selected}
            placeholder={card.placeholder}
          />
        </div>

        <div className="space-y-2">
          <span className={label}>Selected ({selected.length})</span>
          {selected.length === 0 ? (
            <p className="text-[11px] leading-relaxed text-slate-400">
              No securities added yet — search above or type a custom ticker and
              press Add.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((s) => (
                <SecurityChip
                  key={s}
                  label={s}
                  size="sm"
                  onRemove={() => setSelected((all) => all.filter((x) => x !== s))}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={label}>Name This Group</span>
            <span className="text-[9px] text-slate-400">
              {groupName.length}/{WATCHLIST_GROUP_NAME_MAX}
            </span>
          </div>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value.slice(0, WATCHLIST_GROUP_NAME_MAX))}
            maxLength={WATCHLIST_GROUP_NAME_MAX}
            placeholder="e.g. Tech Stocks"
            aria-label="Group name"
            className="text-forest-deep w-full rounded-full bg-[#EDF3FF]/45 px-4 py-3 text-[12px] outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#063BAA]/20 dark:bg-slate-800/40 dark:text-white"
          />
        </div>
      </div>

      <div className="absolute right-0 bottom-0 left-0 border-t border-slate-50 bg-white p-5 pt-3 dark:border-slate-800/40 dark:bg-[#0C1524]">
        <button
          type="button"
          onClick={() => canSave && onSave(groupName.trim(), selected)}
          disabled={!canSave}
          className="bg-brand-gradient w-full rounded-full py-3 text-xs font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-98 disabled:pointer-events-none disabled:opacity-40"
        >
          Save Group
        </button>
      </div>
    </OverlayRoot>
  );
}
