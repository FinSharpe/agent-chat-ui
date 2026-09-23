"use client";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { WatchlistCard } from "../../constants/watchlist";
import type { WatchlistGroup } from "../../store/useWatchlistStore";
import { SecurityChip, SecurityPicker } from "./SecurityPicker";

/**
 * Compact centred popup for glancing at — and editing — a saved group's
 * securities without leaving the watchlist (the reference's
 * ViewHoldingsModal).
 */
export function ViewHoldingsModal({
  card,
  group,
  onClose,
  onAddSecurity,
  onRemoveSecurity,
}: {
  card: WatchlistCard;
  group: WatchlistGroup;
  onClose: () => void;
  onAddSecurity: (security: string) => void;
  onRemoveSecurity: (security: string) => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const add = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || group.securities.includes(trimmed)) return;
    onAddSecurity(trimmed);
    setQuery("");
  };

  const n = group.securities.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={group.name}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="font-funnel flex max-h-[78%] w-full max-w-[320px] flex-col overflow-hidden rounded-card bg-white shadow-[0_20px_50px_rgba(10,31,77,0.25)] dark:bg-[#0C1524]"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-50 px-5 py-4 dark:border-slate-800/50">
          <div className="min-w-0">
            <h3 className="text-forest-deep font-geist truncate text-[13px] font-medium dark:text-white">
              {group.name}
            </h3>
            <p className="text-[10px] text-slate-400">
              {n} securit{n === 1 ? "y" : "ies"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="hover-tint flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-100 text-slate-400 transition-colors dark:border-slate-800"
          >
            <X size={14} />
          </button>
        </div>

        <div className="scrollbar-none flex-1 space-y-4 overflow-y-auto p-5">
          {n === 0 ? (
            <p className="text-[11px] leading-relaxed text-slate-400">
              No securities left in this group — add some below.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {group.securities.map((s) => (
                <SecurityChip
                  key={s}
                  label={s}
                  onRemove={() => onRemoveSecurity(s)}
                />
              ))}
            </div>
          )}

          <div className="space-y-2 border-t border-slate-50 pt-3.5 dark:border-slate-800/50">
            <span className="block text-[10px] font-medium tracking-wider text-slate-400 uppercase">
              Add More
            </span>
            <SecurityPicker
              kind={card.search}
              query={query}
              onQueryChange={setQuery}
              onAdd={add}
              exclude={group.securities}
              placeholder="Search or type a ticker"
              compact
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
