"use client";

import { useState } from "react";
import { ArrowUpRight, Clock, Play, X } from "lucide-react";
import { OverlayRoot } from "@/components/shared/Popup";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import {
  videoEmbedUrl,
  videoWatchUrl,
  type LearnVideo,
} from "../../constants/learn";
import { VideoThumbnail } from "../shared/VideoThumbnail";

/**
 * The reference's Home `VideoDetail`: kind label and close in the header,
 * then the kind pill with "channel · duration", the title and a 16:9 media
 * block with a centred play button — a popup on desktop, a full-screen sheet
 * with the media on top and a Play Video button on mobile.
 *
 * Play swaps the thumbnail for YouTube's privacy-enhanced embed of the real
 * talk. The reference's description paragraph is left out: the curated list
 * carries none, and we do not write one.
 */
export function VideoDetail({
  video,
  onClose,
}: {
  video: LearnVideo;
  onClose: () => void;
}) {
  const isDesktopWeb = useIsDesktopWeb();
  const [playing, setPlaying] = useState(false);

  const media = (cls: string) => (
    <div
      className={`group/media relative flex aspect-video w-full items-center justify-center overflow-hidden bg-[#0A1F4D] ${cls}`}
    >
      {playing ? (
        <iframe
          src={videoEmbedUrl(video.id)}
          title={video.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <>
          <VideoThumbnail
            id={video.id}
            eager
          />
          <div className="absolute inset-0 bg-black/10" />
          <button
            onClick={() => setPlaying(true)}
            aria-label={`Play ${video.title}`}
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-xl transition-transform active:scale-95"
          >
            <Play
              size={26}
              className="ml-1 text-[#063BAA]"
              fill="currentColor"
            />
          </button>
          <span className="absolute right-3 bottom-3 flex items-center gap-1 rounded bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white">
            <Clock size={10} />
            {video.duration}
          </span>
        </>
      )}
    </div>
  );

  const meta = (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="rounded-full bg-[#063BAA]/8 px-2 py-0.5 text-[9px] font-medium tracking-wider text-[#063BAA] uppercase">
        {video.kind}
      </span>
      <span className="text-[11px] text-slate-400">
        {video.channel} · {video.duration}
      </span>
      <a
        href={videoWatchUrl(video.id)}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto inline-flex items-center gap-0.5 text-[11px] text-slate-400 transition-colors hover:text-[#063BAA]"
      >
        YouTube
        <ArrowUpRight size={11} />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </div>
  );

  return (
    <OverlayRoot
      onClose={onClose}
      fit
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      aria-label={video.title}
      className="font-funnel absolute inset-0 z-50 flex flex-col bg-[var(--card-bg)]"
    >
      <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-slate-50 px-5">
        <span className="font-geist text-sm font-medium text-[#0A1F4D]">
          {video.kind}
        </span>
        <button
          onClick={onClose}
          aria-label="Close"
          className="hover-tint flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-[#0A1F4D] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="scrollbar-none flex-1 overflow-y-auto pb-8">
        {isDesktopWeb ? (
          <div className="space-y-5 px-8 pt-7 pb-2">
            <div className="space-y-2">
              {meta}
              <h2 className="font-geist text-xl leading-tight font-medium text-[#0A1F4D]">
                {video.title}
              </h2>
            </div>
            {media("rounded-card")}
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[calc(680px*var(--wx,1))]">
            {media("")}
            <div className="space-y-3 p-5">
              {meta}
              <h2 className="font-geist text-lg leading-tight font-medium text-[#0A1F4D]">
                {video.title}
              </h2>
              {!playing && (
                <button
                  onClick={() => setPlaying(true)}
                  className="bg-brand-gradient flex w-full items-center justify-center gap-1.5 rounded-full py-3 text-xs font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <Play
                    size={14}
                    fill="currentColor"
                  />
                  Play Video
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </OverlayRoot>
  );
}
