"use client";

import { SectionLabel } from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import {
  HOME_PUBLICATION_LIMIT,
  PUBLICATIONS,
} from "../../constants/publications";
import type { Publication } from "../../types/home.types";
import { KindMark } from "../shared/KindMark";

const KIND_LABEL: Record<Publication["kind"], string> = {
  video: "Watch",
  post: "Swipe",
  article: "Read",
};

/**
 * FinSharpe Publications — an Instagram-style row of portrait cards that snap
 * one at a time (two per view on desktop), mixing short video, visual posts
 * and long-form articles. Format is signalled by the badge and the footer
 * meta rather than three card shapes, so the row stays uniform.
 */
export function PublicationFeed({
  onOpen,
}: {
  onOpen: (p: Publication) => void;
}) {
  const isDesktopWeb = useIsDesktopWeb();
  const perView = isDesktopWeb ? 2 : 1;
  const gap = isDesktopWeb ? 18 : 12;
  const items = PUBLICATIONS.slice(0, HOME_PUBLICATION_LIMIT);

  return (
    <section className="space-y-2 select-none">
      <SectionLabel className="pl-1">FinSharpe Publications</SectionLabel>
      <div className="mt-3 carousel-mt3 overflow-x-auto snap-x snap-mandatory scrollbar-none">
        <div className={`flex ${isDesktopWeb ? "gap-4.5" : "gap-3"} pb-1`}>
          {items.map((p) => (
            <button
              key={p.id}
              onClick={() => onOpen(p)}
              className="snap-start shrink-0 w-full text-left group/media"
              style={
                perView > 1
                  ? { width: `calc((100% - ${(perView - 1) * gap}px) / ${perView})` }
                  : undefined
              }
            >
              {/* The 430px cap is for phones; on desktop it would shrink the
                  card below its slot and break alignment with the other rows. */}
              <div
                className={`relative ${isDesktopWeb ? "aspect-[0.8988] w-full" : "aspect-[4/5] max-h-[430px]"} rounded-[20px] overflow-hidden flex items-end`}
              >
                <div
                  className={`absolute inset-0 ${p.image ? "bg-cover bg-center" : ""} transition-transform duration-700 ease-out group-hover/media:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover/media:scale-100`}
                  style={
                    p.image
                      ? { backgroundImage: `url(${p.image})` }
                      : { background: p.gradient }
                  }
                />
                {/* Photo covers keep their own colours; flat gradients need a
                    scrim for the title and meta to read at the bottom. */}
                {!p.image && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                )}

                <span className="absolute top-3.5 left-3.5 text-[9.5px] tracking-[0.12em] uppercase text-white bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  {p.category}
                </span>

                {p.kind === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <KindMark p={p} />
                  </span>
                )}
                {p.kind === "post" && (
                  <span className="absolute top-4 right-4">
                    <KindMark p={p} />
                  </span>
                )}

                <div className="relative p-5 space-y-1.5">
                  <p className="v3-display text-[22px] leading-[1.18] text-white line-clamp-3">
                    {p.title}
                  </p>
                  <p className="text-[11.5px] text-white pt-0.5">
                    {KIND_LABEL[p.kind]} ·{" "}
                    {p.duration ?? p.readTime ?? `${p.frames} slides`}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
