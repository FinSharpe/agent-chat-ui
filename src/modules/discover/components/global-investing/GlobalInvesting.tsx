"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, Flame, Sparkle } from "lucide-react";
import FeatureHeader from "@/components/discover/FeatureHeader";
import { PopupFrame } from "@/components/shared/Popup";
import { BANNER_WAVE, SectionBanner } from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import {
  GlobalBasket,
  globalBaskets,
  globalRegions,
  globalRiskColor,
  globalStats,
  globalThemes,
} from "../../constants/global-investing-data";
import { DetailLabel } from "../shared/DetailKit";
import { GlobalBasketDetail } from "./GlobalBasketDetail";

/** Global Investing — thematic international ETF baskets, filterable by theme. */
export function GlobalInvesting({ onBack }: { onBack: () => void }) {
  const [theme, setTheme] = useState("All");
  const [selected, setSelected] = useState<GlobalBasket | null>(null);
  const isDesktopWeb = useIsDesktopWeb();

  const detail = selected ? (
    <GlobalBasketDetail
      b={selected}
      onBack={() => setSelected(null)}
    />
  ) : null;
  // Mobile swaps the page for the detail; desktop keeps the page and opens it as a popup.
  if (detail && !isDesktopWeb) return detail;

  const baskets =
    theme === "All"
      ? globalBaskets
      : globalBaskets.filter((b) => b.category === theme);

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      {isDesktopWeb && (
        <AnimatePresence>
          {detail && (
            <PopupFrame onClose={() => setSelected(null)}>{detail}</PopupFrame>
          )}
        </AnimatePresence>
      )}
      <FeatureHeader
        title="Global Investing"
        subtitle="Thematic ETF baskets · International markets"
        onBack={onBack}
      />
      <div className="scrollbar-none flex-1 space-y-6 overflow-y-auto px-5 py-5 pb-[130px]">
        <div className="space-y-3">
          <SectionBanner
            eyebrow="Invest Beyond India"
            title="Thematic global ETF baskets across international markets"
            tone="blue"
            height={260}
            image={BANNER_WAVE.teal}
            imageScrim
          />
          <div className="flex flex-wrap gap-1.5">
            {globalRegions.map((r) => (
              <span
                key={r}
                className="rounded-full bg-[#063BAA]/8 px-2.5 py-1 text-[10px] font-medium whitespace-nowrap text-[#063BAA]"
              >
                {r}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-4 divide-x divide-slate-100 border-y border-slate-100 dark:divide-slate-800/60 dark:border-slate-800/60">
            {globalStats.map((s) => (
              <div
                key={s.label}
                className="px-2 py-3.5 text-center"
              >
                <p className="font-geist text-sm font-medium text-[#0A1F4D]">
                  {s.value}
                </p>
                <p className="mt-0.5 text-[8px] leading-tight tracking-wider text-slate-400 uppercase">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <DetailLabel>Filter by Theme</DetailLabel>
          <div className="scrollbar-none mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {globalThemes.map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`rounded-full px-3 py-1.5 text-[10px] font-medium whitespace-nowrap transition-colors ${theme === t ? "bg-[#063BAA] text-white" : "bg-[#063BAA]/6 text-slate-500"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800/60">
          {baskets.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelected(b)}
              className="flex w-full items-center gap-3 px-4.5 py-3.5 text-left transition-colors active:bg-[#063BAA]/[0.03]"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="font-geist truncate text-[13px] font-medium text-[#0A1F4D] dark:text-white">
                    {b.name}
                  </span>
                  {b.badge && (
                    <span
                      className={`flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-medium tracking-wider uppercase ${b.badge === "Hot" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" : "bg-[#97edcc]/25 text-[#0A9E6E]"}`}
                    >
                      {b.badge === "Hot" ? (
                        <Flame size={9} />
                      ) : (
                        <Sparkle size={9} />
                      )}
                      {b.badge}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {b.category} · {b.etfCount} ETFs
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-[12px] font-medium text-[#0A9E6E] tabular-nums">
                  {b.return1Y}
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[8.5px] font-medium tracking-wider uppercase ${globalRiskColor(b.risk)}`}
                >
                  {b.risk}
                </span>
                <ArrowRight
                  size={13}
                  className="text-slate-300 dark:text-slate-600"
                />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
