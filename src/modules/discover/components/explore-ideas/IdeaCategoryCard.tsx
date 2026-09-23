"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Building2,
  ChevronDown,
  FileText,
  Newspaper,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { IdeaCategory } from "../../types/discover.types";
import { StrategyRow } from "./StrategyRow";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  advisors: Users,
  special: Star,
  "news-based": Newspaper,
  research: FileText,
  filings: Building2,
  curated: Sparkles,
  themes: TrendingUp,
  investors: Award,
};

const TONES = ["tone-blue", "tone-mint", "tone-navy"];

function StatusRow({ children }: { children: React.ReactNode }) {
  return <p className="px-4.5 py-4 text-[11px] text-slate-400">{children}</p>;
}

/**
 * A category card with a collapsible header. Open, its strategies show as
 * cardless rows — about three visible, the rest scrolling within the card.
 *
 * A category with nothing behind it (`category.disabled`) is not a closed
 * card that could be opened: it has no click target, no chevron and no count,
 * and carries a "Coming soon" chip where the count would be. It must never
 * show a strategy count for content that does not exist.
 */
export function IdeaCategoryCard({
  category,
  index,
  isOpen,
  onToggle,
  onSelect,
}: {
  category: IdeaCategory;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
}) {
  const Icon = CATEGORY_ICONS[category.id] ?? Sparkles;
  const count = category.strategies.length;
  const disabled = !!category.disabled;

  const header = (
    <>
      <span
        className={`rounded-tile flex h-10 w-10 shrink-0 items-center justify-center ${TONES[index % 3]} ${disabled ? "opacity-45" : ""}`}
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`font-geist block text-[13px] leading-snug font-medium text-[#0A1F4D] dark:text-white ${disabled ? "opacity-55" : ""}`}
        >
          {category.name}
        </span>
        {disabled ? (
          <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium tracking-wider text-slate-500 uppercase">
            Coming soon
          </span>
        ) : (
          <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
            {category.isLoading
              ? "Loading strategies…"
              : `${count} ${count === 1 ? "strategy" : "strategies"}`}
          </span>
        )}
      </span>
    </>
  );

  if (disabled) {
    return (
      <div
        aria-disabled="true"
        className="glass-card rounded-card flex cursor-default items-center gap-3.5 p-4.5 shadow-none select-none"
      >
        {header}
      </div>
    );
  }

  return (
    <div className="glass-card rounded-card overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`flex w-full items-center gap-3.5 p-4.5 text-left transition-colors ${isOpen ? "border-b border-slate-100 dark:border-slate-800/40" : ""}`}
      >
        {header}
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
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
            {category.isLoading ? (
              <StatusRow>Loading strategies…</StatusRow>
            ) : category.isError ? (
              <StatusRow>
                Couldn&apos;t load these strategies. Please try again later.
              </StatusRow>
            ) : count === 0 ? (
              <StatusRow>No strategies here yet.</StatusRow>
            ) : (
              <div className="scrollbar-none max-h-[210px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800/60">
                {category.strategies.map((s) => (
                  <StrategyRow
                    key={s.id}
                    s={s}
                    onClick={() => onSelect(s.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
