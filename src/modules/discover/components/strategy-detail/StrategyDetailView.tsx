"use client";

import { useState } from "react";
import { Download, MessageSquare, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import FeatureHeader from "@/components/discover/FeatureHeader";
import { useInPopup } from "@/components/shared/Popup";
import { BANNER_WAVE, SectionBanner } from "@/components/shared/SectionKit";
import { DetailTabId, StrategyDetailModel } from "../../types/discover.types";
import { riskColor, signTone } from "../../utils/format";
import { riskLabel } from "../../utils/strategy-detail-model";
import { DetailTabs } from "./DetailTabs";

const iconBtn =
  "w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center transition-colors";

interface Props {
  model: StrategyDetailModel;
  onBack: () => void;
  /** "Analyse in chat" — imports the holdings, or seeds a prompt. */
  onAnalyse: () => void;
  analysing?: boolean;
  /** Present when there are real holdings to save. */
  onDownload?: () => void;
  /** Present when the strategy has a shareable deep link. */
  shareId?: string;
}

const DISCLAIMER =
  "FinSharpe is a SEBI Registered Investment Adviser. Everything on this page describes the strategy's current published portfolio, not a track record. Not investment advice.";

/**
 * The reference StrategyDetail layout — banner, tag row, a divided stat
 * strip, pill tabs over cardless sections, a sticky Analyse bar — carrying
 * finsharpe-mobile's point-in-time analytics in place of the reference's
 * trailing-return charts (finsharpe-agents#92). A popup on desktop, a full
 * screen on mobile.
 */
export function StrategyDetailView({
  model,
  onBack,
  onAnalyse,
  analysing = false,
  onDownload,
  shareId,
}: Props) {
  const canAnalyse = model.holdings.length > 0;
  const [tab, setTab] = useState<DetailTabId>(model.tabs[0]);
  const inPopup = useInPopup();

  const share = async () => {
    if (!shareId) return;
    const url = `${window.location.origin}/discover/${encodeURIComponent(shareId)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      <FeatureHeader
        title={model.title}
        onBack={onBack}
        right={
          <div className="flex items-center gap-1.5">
            <button
              onClick={share}
              disabled={!shareId}
              aria-label="Copy link"
              className={`${iconBtn} hover-tint text-slate-400 disabled:opacity-40`}
            >
              <Share2 size={14} />
            </button>
            <button
              onClick={onDownload}
              disabled={!onDownload}
              aria-label="Download holdings"
              className={`${iconBtn} hover-tint text-slate-400 disabled:opacity-40`}
            >
              <Download size={14} />
            </button>
          </div>
        }
      />

      <div className="scrollbar-none flex-1 overflow-y-auto pb-24">
        {/* Summary — a flat colour banner, the tag row, then a plain divided stat strip. */}
        <div className="space-y-4 px-5 pt-4">
          <SectionBanner
            eyebrow={model.eyebrow}
            title={model.bannerTitle}
            tone="blue"
            height={260}
            image={BANNER_WAVE.royal}
            imageScrim
          />
          <div className="flex flex-wrap gap-1.5">
            {model.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-[#063BAA]/8 px-2 py-0.5 text-[9px] font-medium tracking-wider text-[#063BAA] uppercase"
              >
                {t}
              </span>
            ))}
            {model.risk && (
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-medium tracking-wider uppercase ${riskColor(model.risk)}`}
              >
                {riskLabel(model.risk)}
              </span>
            )}
          </div>
          {model.meta && (
            <p className="-mt-2 text-[10px] text-slate-400">{model.meta}</p>
          )}
          {/* 2×2 in a phone column — "NIFTY 500 -0.29%" won't fit a quarter. */}
          <div
            className={`grid border-y border-slate-100 dark:border-slate-800/60 ${inPopup ? "grid-cols-4" : "grid-cols-2"}`}
          >
            {model.stats.map((s, i) => (
              <div
                key={s.label}
                className={cn(
                  "border-slate-100 px-3 py-3 text-center dark:border-slate-800/60",
                  inPopup
                    ? i > 0 && "border-l"
                    : [i % 2 === 0 && "border-r", i < 2 && "border-b"],
                )}
              >
                <p className="text-[9px] leading-tight tracking-wider text-slate-400 uppercase">
                  {s.label}
                </p>
                <p
                  className={`font-geist mt-1 text-sm font-medium tabular-nums ${s.signed ? signTone(s.value) : "text-[#0A1F4D] dark:text-white"}`}
                >
                  {s.value}
                </p>
                {s.sub && (
                  <p className="mt-0.5 truncate text-[9.5px] text-slate-400 tabular-nums">
                    {s.sub}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <DetailTabs
          model={model}
          tab={tab}
          onTab={setTab}
          inPopup={inPopup}
        />
        <p className="px-5 pt-2 text-[10px] leading-relaxed text-slate-400">
          {DISCLAIMER}
        </p>
      </div>

      {/* Sticky footer */}
      <div className="bg-background/80 mb-[76px] flex shrink-0 justify-center gap-2.5 border-t border-slate-100 px-5 py-3 backdrop-blur-md">
        <button
          onClick={onAnalyse}
          disabled={analysing || !canAnalyse}
          className="bg-brand-gradient flex min-w-40 items-center justify-center gap-1.5 rounded-full px-6 py-3 text-xs font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-98 disabled:opacity-70"
        >
          <MessageSquare size={14} />{" "}
          {analysing ? "Adding to chat…" : "Analyse in chat"}
        </button>
      </div>
    </div>
  );
}
