"use client";

import { useState } from "react";
import { Bookmark, Download, MessageSquare, Share2 } from "lucide-react";
import { toast } from "sonner";
import FeatureHeader from "@/components/discover/FeatureHeader";
import { useInPopup } from "@/components/shared/Popup";
import { BANNER_WAVE, SectionBanner } from "@/components/shared/SectionKit";
import { StrategyDetailModel } from "../../types/discover.types";
import { riskColor, signTone } from "../../utils/format";
import { DetailTabs, TabId } from "./DetailTabs";

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

/**
 * The reference StrategyDetail layout: banner, tag row, a divided stat
 * strip, pill tabs over cardless sections, and a sticky Track / Analyse bar.
 * A popup on desktop, a full screen on mobile.
 */
export function StrategyDetailView({
  model,
  onBack,
  onAnalyse,
  analysing = false,
  onDownload,
  shareId,
}: Props) {
  const [tab, setTab] = useState<TabId>(model.tabs[0]);
  // Tracking is local to the visit — the app has no watchlist API yet.
  const [tracked, setTracked] = useState(false);
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
              onClick={() => setTracked((t) => !t)}
              aria-label={tracked ? "Stop tracking" : "Track"}
              className={`${iconBtn} ${tracked ? "bg-[#063BAA]/8 text-[#063BAA]" : "hover-tint text-slate-400"}`}
            >
              <Bookmark
                size={14}
                fill={tracked ? "currentColor" : "none"}
              />
            </button>
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
                {model.risk} Risk
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100 dark:divide-slate-800/60 dark:border-slate-800/60">
            {model.stats.map((s) => (
              <div
                key={s.label}
                className="px-3 py-3 text-center"
              >
                <p className="text-[9px] leading-tight tracking-wider text-slate-400 uppercase">
                  {s.label}
                </p>
                <p
                  className={`font-geist mt-1 text-sm font-medium ${s.accent ? signTone(s.value) : "text-[#0A1F4D] dark:text-white"}`}
                >
                  {s.value}
                </p>
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
      </div>

      {/* Sticky footer */}
      <div className="bg-background/80 mb-[76px] flex shrink-0 gap-2.5 border-t border-slate-100 px-5 py-3 backdrop-blur-md">
        <button
          onClick={() => setTracked((t) => !t)}
          className="flex-1 rounded-full bg-[#DFF9EF] py-3 text-xs font-medium tracking-wide text-[#0A1F4D] uppercase transition-colors"
        >
          {tracked ? "Tracking" : "Track"}
        </button>
        <button
          onClick={onAnalyse}
          disabled={analysing}
          className="bg-brand-gradient flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-xs font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-98 disabled:opacity-70"
        >
          <MessageSquare size={14} />{" "}
          {analysing ? "Adding to chat…" : "Analyse in chat"}
        </button>
      </div>
    </div>
  );
}
