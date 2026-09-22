"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Flame,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import FeatureHeader from "@/components/discover/FeatureHeader";
import { PopupFrame } from "@/components/shared/Popup";
import { BANNER_WAVE, SectionBanner } from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import {
  TradeRisk,
  TradeScenario,
  TradingAlgo,
  tradeRiskColor,
  tradeRisks,
  tradeScenarios,
  tradingAlgos,
  tradingStats,
} from "../../constants/trading-ideas-data";
import { DetailLabel } from "../shared/DetailKit";
import { AlgoDetail } from "./AlgoDetail";

const scenarioIcon = (s: TradeScenario) =>
  s === "Bullish" ? TrendingUp : s === "Bearish" ? TrendingDown : Minus;

/** Explore Trading Ideas — algorithms filtered by market scenario and risk. */
export function TradingIdeas({ onBack }: { onBack: () => void }) {
  const [scenario, setScenario] = useState<TradeScenario>("Bullish");
  const [risk, setRisk] = useState<TradeRisk | "All">("All");
  const [selected, setSelected] = useState<TradingAlgo | null>(null);
  const isDesktopWeb = useIsDesktopWeb();

  const detail = selected ? (
    <AlgoDetail
      a={selected}
      onBack={() => setSelected(null)}
    />
  ) : null;
  // Mobile swaps the page for the detail; desktop keeps the page and opens it as a popup.
  if (detail && !isDesktopWeb) return detail;

  const filtered = tradingAlgos.filter(
    (a) => a.scenario === scenario && (risk === "All" || a.risk === risk),
  );
  const note = tradeScenarios.find((s) => s.id === scenario)?.note;

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
        title="Explore Trading Ideas"
        subtitle="Exchange-approved algorithmic strategies"
        onBack={onBack}
      />
      <div className="scrollbar-none flex-1 space-y-6 overflow-y-auto px-5 py-5 pb-[130px]">
        <div className="space-y-3">
          <SectionBanner
            eyebrow="SEBI Compliant"
            title="Exchange-approved algorithms, backtested and compliance-vetted"
            tone="blue"
            height={260}
            image={BANNER_WAVE.sky}
            imageScrim
          />
          <div className="grid grid-cols-4 divide-x divide-slate-100 border-y border-slate-100 dark:divide-slate-800/60 dark:border-slate-800/60">
            {tradingStats.map((s) => (
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

        <div className="space-y-2">
          <DetailLabel>Market Scenario</DetailLabel>
          <div className="grid grid-cols-3 gap-2">
            {tradeScenarios.map((s) => {
              const Icon = scenarioIcon(s.id);
              const active = scenario === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setScenario(s.id)}
                  className={`rounded-nested flex flex-col items-center gap-1 p-2.5 transition-colors ${active ? "bg-[#063BAA] text-white" : "glass-card text-slate-500"}`}
                >
                  <Icon size={16} />
                  <span className="text-[11px] font-medium">{s.id}</span>
                </button>
              );
            })}
          </div>
          <p className="px-0.5 text-[10px] text-slate-400">{note}</p>
        </div>

        <div className="space-y-2">
          <DetailLabel>Risk Profile</DetailLabel>
          <div className="scrollbar-none flex gap-1.5 overflow-x-auto pb-1">
            {tradeRisks.map((r) => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={`rounded-full px-3 py-1.5 text-[10px] font-medium whitespace-nowrap transition-colors ${risk === r ? "bg-[#063BAA] text-white" : "bg-[#063BAA]/6 text-slate-500"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <p className="px-0.5 text-[10px] font-medium text-slate-400">
          {filtered.length} strategies found
        </p>

        {filtered.length > 0 && (
          <div className="glass-card rounded-card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800/60">
            {filtered.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className="flex w-full items-center gap-3 px-4.5 py-3.5 text-left transition-colors active:bg-[#063BAA]/[0.03]"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="font-geist truncate text-[13px] font-medium text-[#0A1F4D] dark:text-white">
                      {a.name}
                    </span>
                    {a.popular && (
                      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-[8px] font-medium tracking-wider text-rose-600 uppercase dark:bg-rose-500/15 dark:text-rose-400">
                        <Flame size={9} />
                        Popular
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {a.tags.join(" · ")}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-[12px] font-medium text-[#0A9E6E] tabular-nums">
                    {a.annualReturn}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[8.5px] font-medium tracking-wider uppercase ${tradeRiskColor(a.risk)}`}
                  >
                    {a.risk}
                  </span>
                  <ArrowRight
                    size={13}
                    className="text-slate-300 dark:text-slate-600"
                  />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
