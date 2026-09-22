"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import type { WatchlistCard } from "../../constants/watchlist";
import type { WatchlistGroup } from "../../store/useWatchlistStore";

/**
 * One watchlist card (Equity / Mutual Fund / ETF): Add Securities, Analyse
 * All, and a "Saved Groups" accordion — each group with Analyse, edit and
 * delete.
 */
export function WatchlistGroupCard({
  card,
  groups,
  isOpen,
  onToggle,
  onAddSecurities,
  onAnalyseAll,
  onAnalyseGroup,
  onEditGroup,
  onDeleteGroup,
}: {
  card: WatchlistCard;
  groups: WatchlistGroup[];
  isOpen: boolean;
  onToggle: () => void;
  onAddSecurities: () => void;
  onAnalyseAll: () => void;
  onAnalyseGroup: (group: WatchlistGroup) => void;
  onEditGroup: (group: WatchlistGroup) => void;
  onDeleteGroup: (group: WatchlistGroup) => void;
}) {
  const Icon = card.icon;
  const hasSecurities = groups.some((g) => g.securities.length > 0);

  return (
    <div className="glass-card animate-fade-in space-y-3.5 rounded-card p-4.5">
      <div className="flex items-center gap-3.5">
        <div className="rounded-nested flex h-10 w-10 shrink-0 items-center justify-center bg-[#97edcc]/30 text-[#0A9E6E]">
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-forest-deep text-[12px] font-medium dark:text-white">
            {card.name}
          </p>
          <p className="text-[10px] leading-snug text-slate-500 dark:text-slate-400">
            {card.desc}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAddSecurities}
          className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#DFF9EF] py-2.5 text-[10px] font-medium text-[#0A1F4D]"
        >
          <Plus size={12} /> Add Securities
        </button>
        <button
          type="button"
          onClick={onAnalyseAll}
          disabled={!hasSecurities}
          title={hasSecurities ? undefined : "Add securities to analyse them"}
          className="bg-brand-gradient flex flex-1 items-center justify-center gap-1 rounded-full py-2.5 text-[10px] font-medium text-white hover:brightness-110 disabled:pointer-events-none disabled:opacity-40"
        >
          Analyse All {card.analyseAllLabel}
        </button>
      </div>

      {groups.length > 0 && (
        <div className="rounded-nested overflow-hidden border border-slate-100 dark:border-slate-800/60">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            className="hover-tint flex w-full items-center justify-between px-3.5 py-3 transition-colors"
          >
            <span className="text-forest-deep text-[11px] font-medium dark:text-white">
              Saved Groups
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400">
                {groups.length} group{groups.length > 1 ? "s" : ""}
              </span>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </span>
          </button>
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="scrollbar-none max-h-[98px] divide-y divide-slate-100 overflow-y-auto px-3.5 pb-1 dark:divide-slate-800/60">
                  {groups.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center gap-1.5 py-2.5"
                    >
                      <h4
                        className="text-forest-deep font-geist min-w-0 flex-1 truncate text-[13px] font-medium dark:text-white"
                        title={`${g.name} — ${g.securities.join(", ")}`}
                      >
                        {g.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => onAnalyseGroup(g)}
                        disabled={g.securities.length === 0}
                        className="bg-brand-gradient shrink-0 rounded-full px-3 py-1.5 text-[10px] font-medium text-white hover:brightness-110 disabled:pointer-events-none disabled:opacity-40"
                      >
                        Analyse
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditGroup(g)}
                        aria-label={`Edit ${g.name}`}
                        title="Edit holdings"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-[#DFF9EF] hover:text-[#0A1F4D] dark:hover:bg-blue-500/10"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteGroup(g)}
                        aria-label={`Delete ${g.name}`}
                        title="Delete group"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
