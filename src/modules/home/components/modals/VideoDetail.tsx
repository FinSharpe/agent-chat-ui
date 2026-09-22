"use client";

import { Clock, Play, X } from "lucide-react";
import { OverlayRoot } from "@/components/shared/Popup";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import type { HomeVideo } from "../../types/home.types";

function Hero({ video, className }: { video: HomeVideo; className: string }) {
  return (
    <div className={`relative aspect-video w-full overflow-hidden flex items-center justify-center group/media ${className}`}>
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out group-hover/media:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover/media:scale-100"
        style={{ background: video.gradient }}
      />
      <div className="absolute inset-0 bg-black/10" />
      <button
        aria-label="Play video"
        className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl active:scale-95 transition-transform relative"
      >
        <Play size={26} className="text-[#063BAA] ml-1" fill="currentColor" />
      </button>
      <span className="absolute bottom-3 right-3 text-[10px] font-medium bg-black/50 text-white px-2 py-0.5 rounded flex items-center gap-1">
        <Clock size={10} />
        {video.duration}
      </span>
    </div>
  );
}

function Meta({ video }: { video: HomeVideo }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-medium uppercase tracking-wider bg-[#063BAA]/8 text-[#063BAA] px-2 py-0.5 rounded-full">
        {video.type}
      </span>
      <span className="text-[11px] text-slate-400">
        {video.source} · {video.duration}
      </span>
    </div>
  );
}

/** Watch & Learn detail — a content-sized popup on desktop, a full-screen
 *  sheet over Home on mobile. There is no video source yet, so play is
 *  presentational. */
export function VideoDetail({
  video,
  onClose,
}: {
  video: HomeVideo;
  onClose: () => void;
}) {
  const isDesktopWeb = useIsDesktopWeb();

  return (
    <OverlayRoot
      onClose={onClose}
      fit
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-white flex flex-col font-funnel"
    >
      <div className="h-[52px] px-5 flex items-center justify-between shrink-0 border-b border-slate-50">
        <span className="text-sm font-geist font-medium text-[#0A1F4D]">
          {video.type}
        </span>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-[#0A1F4D] hover-tint transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none pb-[120px]">
        {isDesktopWeb ? (
          <div className="px-8 pt-7 pb-8 space-y-5">
            <div className="space-y-2">
              <Meta video={video} />
              <h2 className="text-xl font-geist font-medium text-[#0A1F4D] leading-tight">
                {video.title}
              </h2>
            </div>
            <Hero video={video} className="rounded-card" />
            <p className="text-[13px] text-slate-500 leading-relaxed">
              {video.description}
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[calc(680px*var(--wx,1))]">
            <Hero video={video} className="" />
            <div className="p-5 space-y-3">
              <Meta video={video} />
              <h2 className="text-lg font-geist font-medium text-[#0A1F4D] leading-tight">
                {video.title}
              </h2>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                {video.description}
              </p>
              <button className="w-full bg-brand-gradient text-white py-3 rounded-full font-medium text-xs uppercase tracking-wide hover:brightness-110 transition-all active:scale-98 flex items-center justify-center gap-1.5">
                <Play size={14} fill="currentColor" /> Play Video
              </button>
            </div>
          </div>
        )}
      </div>
    </OverlayRoot>
  );
}
