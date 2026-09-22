"use client";

import { ShieldCheck } from "lucide-react";
import FeatureHeader from "@/components/discover/FeatureHeader";
import {
  TradingAlgo,
  tradeRiskColor,
} from "../../constants/trading-ideas-data";
import { DetailLabel, KeyValueRows } from "../shared/DetailKit";

function Metric({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="px-3 py-3 text-center">
      <p
        className={`font-geist text-sm font-medium ${positive ? "text-[#0A9E6E]" : "text-[#0A1F4D] dark:text-white"}`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[8px] tracking-wider text-slate-400 uppercase">
        {label}
      </p>
    </div>
  );
}

/** One trading algorithm — metric strip, logic, and its instrument details. */
export function AlgoDetail({
  a,
  onBack,
}: {
  a: TradingAlgo;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      <FeatureHeader
        title={a.name}
        subtitle={a.instrument}
        onBack={onBack}
      />
      <div className="scrollbar-none flex-1 overflow-y-auto px-5 py-5 pb-[130px]">
        <div className="flex flex-wrap gap-1.5">
          {a.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-[#063BAA]/8 px-2 py-0.5 text-[9px] font-medium tracking-wider text-[#063BAA] uppercase"
            >
              {t}
            </span>
          ))}
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-medium tracking-wider uppercase ${tradeRiskColor(a.risk)}`}
          >
            {a.risk}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 divide-x divide-y divide-slate-100 border-y border-slate-100 dark:divide-slate-800/60 dark:border-slate-800/60">
          <Metric
            label="Annual Return"
            value={a.annualReturn}
            positive
          />
          <Metric
            label="Max Drawdown"
            value={a.maxDD}
          />
          <Metric
            label="Win Rate"
            value={a.winRate}
          />
          <Metric
            label="Sharpe Ratio"
            value={a.sharpe}
          />
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          <section className="py-5">
            <DetailLabel flush>Strategy Logic</DetailLabel>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              {a.logic}
            </p>
          </section>

          <section className="py-5">
            <KeyValueRows
              rows={[
                { label: "Instrument", value: a.instrument },
                { label: "Exchange", value: a.exchange },
                { label: "Timeframe", value: a.timeframe },
                { label: "Risk Profile", value: a.risk },
              ]}
            />
          </section>
        </div>

        <div className="rounded-nested mt-5 flex items-center gap-2 bg-[#97edcc]/20 p-3 text-[#0A9E6E]">
          <ShieldCheck
            size={16}
            className="shrink-0"
          />
          <span className="text-[11px] font-medium">
            Exchange-Approved Algorithm · SEBI Compliant
          </span>
        </div>

        <p className="mt-4 text-[9px] leading-relaxed text-slate-400">
          Algorithmic trading involves substantial risk. Past backtested
          performance does not guarantee future results. Deploy only through
          SEBI-registered brokers with appropriate risk controls. For
          informational purposes only.
        </p>
      </div>
    </div>
  );
}
