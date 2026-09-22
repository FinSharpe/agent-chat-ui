"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import FeatureHeader from "@/components/discover/FeatureHeader";
import {
  GlobalBasket,
  basketHoldings,
} from "../../constants/global-investing-data";
import { DetailLabel, KeyValueRows } from "../shared/DetailKit";

/** One global ETF basket — stat strip, the why-note, its ETF mix and terms. */
export function GlobalBasketDetail({
  b,
  onBack,
}: {
  b: GlobalBasket;
  onBack: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const holdings = basketHoldings(b);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      <FeatureHeader
        title={b.name}
        subtitle={`${b.category} · ${b.currency} · ${b.rebalance}`}
        onBack={onBack}
      />
      <div className="scrollbar-none flex-1 overflow-y-auto px-5 py-5 pb-[130px]">
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          {b.desc}
        </p>

        <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100 dark:divide-slate-800/60 dark:border-slate-800/60">
          {[
            { l: "1Y Return", v: b.return1Y, accent: true },
            { l: "3Y Return", v: b.return3Y },
            { l: "Risk Level", v: b.risk },
          ].map((s) => (
            <div
              key={s.l}
              className="px-3 py-3 text-center"
            >
              <p className="text-[9px] leading-tight tracking-wider text-slate-400 uppercase">
                {s.l}
              </p>
              <p
                className={`font-geist mt-1 text-sm font-medium ${s.accent ? "text-[#0A9E6E]" : "text-[#0A1F4D] dark:text-white"}`}
              >
                {s.v}
              </p>
            </div>
          ))}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          <section className="py-5">
            <DetailLabel>Why This Basket</DetailLabel>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              {b.why}
            </p>
          </section>

          <section className="py-5">
            <DetailLabel>ETF Holdings</DetailLabel>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-24 w-24 shrink-0">
                {mounted && (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={holdings}
                        cx="50%"
                        cy="50%"
                        innerRadius={26}
                        outerRadius={44}
                        paddingAngle={2}
                        dataKey="weight"
                      >
                        {holdings.map((h) => (
                          <Cell
                            key={h.ticker}
                            fill={h.color}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex-1 space-y-1">
                {holdings.map((h) => (
                  <div
                    key={h.ticker}
                    className="flex items-center gap-1.5 text-[10px]"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: h.color }}
                    />
                    <span className="font-medium text-[#0A1F4D] dark:text-white">
                      {h.ticker}
                    </span>
                    <span className="ml-auto text-slate-400 tabular-nums">
                      {h.weight}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800/60">
              <div className="flex pb-1 text-[9px] font-medium tracking-wider text-slate-400 uppercase">
                <span className="w-12">Ticker</span>
                <span className="flex-1">Fund</span>
                <span className="w-12 text-right">Weight</span>
                <span className="w-12 text-right">ER</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {holdings.map((h) => (
                  <div
                    key={h.ticker}
                    className="flex items-center py-1.5 text-[10px]"
                  >
                    <span className="w-12 font-medium text-[#063BAA]">
                      {h.ticker}
                    </span>
                    <span className="flex-1 truncate text-slate-500 dark:text-slate-400">
                      {h.fundName}
                    </span>
                    <span className="w-12 text-right text-[#0A1F4D] tabular-nums dark:text-white">
                      {h.weight}%
                    </span>
                    <span className="w-12 text-right text-slate-400 tabular-nums">
                      {h.expenseRatio}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-5">
            <KeyValueRows
              rows={[
                { label: "Min Investment", value: b.minInvest },
                { label: "Currency", value: b.currency },
                { label: "Rebalancing", value: b.rebalance },
                { label: "Risk Category", value: b.risk },
              ]}
            />
          </section>
        </div>

        <p className="mt-4 text-[9px] leading-relaxed text-slate-400">
          Investments in international ETFs carry currency risk and are subject
          to foreign market regulations. Routed via SEBI-registered
          intermediaries under the LRS framework. For informational purposes
          only.
        </p>
      </div>
    </div>
  );
}
