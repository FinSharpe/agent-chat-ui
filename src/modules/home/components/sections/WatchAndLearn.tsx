"use client";

import { Clock, Play } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { HOME_VIDEOS } from "../../constants/videos";
import type { HomeVideo } from "../../types/home.types";

/** Tall video cards in the SectionBanner shape language — thumbnail on the
 *  top ~60%, a plain panel below with title, source and a Watch Now CTA. */
export function WatchAndLearn({
  onOpen,
}: {
  onOpen: (video: HomeVideo) => void;
}) {
  const isDesktopWeb = useIsDesktopWeb();

  return (
    <section className="space-y-3 select-none">
      <SectionLabel className="pl-1">Watch &amp; Learn</SectionLabel>
      <div
        className={`flex overflow-x-auto snap-x snap-mandatory ${isDesktopWeb ? "gap-4.5" : "gap-3"} scrollbar-none pb-1`}
      >
        {HOME_VIDEOS.map((v) => (
          <button
            key={v.id}
            onClick={() => onOpen(v)}
            className={`${isDesktopWeb ? "min-w-[calc(50%-9px)] w-[calc(50%-9px)]" : "min-w-[210px] w-[210px]"} h-[340px] snap-start text-left rounded-card overflow-hidden premium-shadow-sm bg-white flex flex-col group group/media`}
          >
            <div className="relative h-[60%] shrink-0 overflow-hidden">
              <div
                className={`absolute inset-0 ${v.image ? "bg-cover bg-center" : ""} transition-transform duration-700 ease-out group-hover/media:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover/media:scale-100`}
                style={
                  v.image
                    ? { backgroundImage: `url(${v.image})` }
                    : { background: v.gradient }
                }
              />
              {!v.image && <div className="absolute inset-0 bg-black/10" />}
              <span className="absolute top-3 right-3 text-[9px] font-medium bg-black/50 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Clock size={9} />
                {v.duration}
              </span>
            </div>
            <div className="flex-1 min-h-0 p-3.5 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-[12.5px] font-medium text-[#0A1F4D] font-geist leading-snug line-clamp-2 flex-1 min-w-0">
                    {v.title}
                  </h4>
                  <span className="shrink-0 text-[8px] font-medium uppercase tracking-wider bg-[#063BAA]/8 text-[#063BAA] px-1.5 py-0.5 rounded-full">
                    {v.type}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">{v.source}</p>
              </div>
              <span className="inline-flex items-center justify-center gap-1.5 bg-brand-gradient text-white text-[11px] font-medium py-2 rounded-full w-full">
                Watch Now <Play size={10} fill="currentColor" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
