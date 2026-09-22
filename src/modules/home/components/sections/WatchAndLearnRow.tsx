"use client";

import { useState } from "react";
import { Clock, Play } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import {
  LEARN_VIDEOS,
  videoFallbackThumbnail,
  videoThumbnail,
  videoWatchUrl,
  type LearnVideo,
} from "../../constants/learn";

/**
 * Watch & Learn — the reference's video card (duration chip on the
 * thumbnail, title with the kind pill beside it, the channel, a Watch Now
 * pill) over finsharpe-mobile's curated FinSharpe talks. As on the app, the
 * thumbnail keeps YouTube's 16:9 rather than the reference's fixed-height
 * crop, and a card opens the talk on YouTube: they are appearances on other
 * people's channels, not videos FinSharpe hosts.
 */
export function WatchAndLearnRow() {
  const isDesktopWeb = useIsDesktopWeb();

  return (
    <section className="space-y-3 select-none">
      <SectionLabel className="pl-1">Watch &amp; Learn</SectionLabel>
      <div
        className={`scrollbar-none flex snap-x snap-mandatory overflow-x-auto pb-1 ${isDesktopWeb ? "gap-4.5" : "gap-3"}`}
      >
        {LEARN_VIDEOS.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            wide={isDesktopWeb}
          />
        ))}
      </div>
    </section>
  );
}

function VideoCard({ video, wide }: { video: LearnVideo; wide: boolean }) {
  return (
    <a
      href={videoWatchUrl(video.id)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${video.title}. ${video.kind} on ${video.channel}. Plays on YouTube.`}
      className={`group/media rounded-card premium-shadow-sm flex shrink-0 snap-start flex-col overflow-hidden bg-[var(--card-bg)] text-left ${
        wide ? "w-[calc(50%-9px)]" : "w-[210px]"
      }`}
    >
      <div className="relative aspect-video shrink-0 overflow-hidden bg-[#0A1F4D]">
        <Thumbnail id={video.id} />
        <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[9px] font-medium text-white">
          <Clock size={9} />
          {video.duration}
        </span>
      </div>

      <div className="flex flex-col p-3.5">
        {/* Two lines reserved for every title, so the Watch Now pills line
            up across the strip. */}
        <div className="flex min-h-[2.75em] items-start justify-between gap-2 text-[12.5px] leading-snug">
          <h4 className="line-clamp-2 min-w-0 flex-1 font-medium text-[#0A1F4D] dark:text-slate-100">
            {video.title}
          </h4>
          <span className="mt-px shrink-0 rounded-full bg-[var(--tone-blue)] px-1.5 py-0.5 text-[8px] font-medium tracking-wider text-[var(--tone-blue-fg)] uppercase">
            {video.kind}
          </span>
        </div>
        <p className="mt-1 truncate text-[10px] text-slate-400">
          {video.channel}
        </p>
        <span className="bg-brand-gradient mt-[22px] inline-flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-[11px] font-medium text-white transition-all group-hover/media:brightness-110">
          Watch Now{" "}
          <Play
            size={10}
            fill="currentColor"
          />
        </span>
      </div>
    </a>
  );
}

/**
 * `maxresdefault` is already 16:9 but not every upload has one; `hqdefault`
 * exists for every video, and its letterbox bars are cropped by the 16:9
 * frame. A missing maxres can arrive as YouTube's 120×90 grey placeholder
 * rather than an error, so that counts as missing too. If both fail, the
 * navy fill behind stays.
 */
function Thumbnail({ id }: { id: string }) {
  const [stage, setStage] = useState<"max" | "hq" | "none">("max");
  if (stage === "none") return null;

  return (
    <img
      src={stage === "max" ? videoThumbnail(id) : videoFallbackThumbnail(id)}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setStage(stage === "max" ? "hq" : "none")}
      onLoad={(e) => {
        if (stage === "max" && e.currentTarget.naturalWidth <= 120) {
          setStage("hq");
        }
      }}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover/media:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover/media:scale-100"
    />
  );
}
