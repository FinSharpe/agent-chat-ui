"use client";

import { ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { MARKET_NEWS } from "../../constants/marketNews";

/** Horizontal news cards; tapping one asks the agent about that headline. */
export function MarketNewsRow({ onAsk }: { onAsk: (prompt: string) => void }) {
  const isDesktopWeb = useIsDesktopWeb();

  return (
    <section className="space-y-3 select-none">
      <SectionLabel className="pl-1">Latest Market News</SectionLabel>
      <div
        className={`flex overflow-x-auto snap-x snap-mandatory ${isDesktopWeb ? "gap-4.5" : "gap-3"} scrollbar-none pb-1`}
      >
        {MARKET_NEWS.map((news) => (
          <div
            key={news.id}
            role="button"
            tabIndex={0}
            onClick={() =>
              onAsk(`Tell me more about the market news: ${news.headline}`)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onAsk(`Tell me more about the market news: ${news.headline}`);
              }
            }}
            className={`${isDesktopWeb ? "min-w-[calc(50%-9px)] w-[calc(50%-9px)]" : "min-w-[270px] w-[270px]"} glass-card rounded-card p-5 snap-start premium-shadow-sm flex flex-col justify-between min-h-[196px] cursor-pointer hover-tint transition-colors`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  {news.category}
                </span>
                <span
                  className={`text-[9px] font-medium py-0.5 px-2.5 rounded-full uppercase tracking-wider shrink-0 ${
                    news.sentiment === "positive"
                      ? "tone-mint"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {news.sentiment}
                </span>
              </div>
              <h4 className="text-[13px] font-medium text-[#0A1F4D] font-geist leading-snug line-clamp-2">
                {news.headline}
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                {news.summary}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 border-t border-slate-50 pt-2.5 mt-2 font-funnel">
              <span className="truncate">
                {news.source} • {news.time}
              </span>
              <span className="text-[#063BAA] font-medium flex items-center gap-1 shrink-0">
                Ask AI <ArrowRight size={10} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
