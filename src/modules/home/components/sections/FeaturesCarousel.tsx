"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import CarouselDots from "@/components/CarouselDots";
import { SectionLabel } from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { FEATURE_CARDS, FEATURE_CARD_IMAGES } from "../../constants/features";
import type { ActionTarget } from "../../types/home.types";

/** The eight feature banners — one full-width slide at a time on mobile, two
 *  side by side on desktop, with a "1/8" counter pinned top-right. */
export function FeaturesCarousel({
  onAction,
}: {
  onAction: (card: ActionTarget) => void;
}) {
  const isDesktopWeb = useIsDesktopWeb();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="space-y-3 select-none">
      <SectionLabel className="pl-1">Features</SectionLabel>
      <div className="relative">
        <div
          ref={scrollRef}
          className={`flex snap-x snap-mandatory overflow-x-auto ${isDesktopWeb ? "gap-4.5" : "gap-3"} scrollbar-none pb-1`}
        >
          {FEATURE_CARDS.map((card, idx) => {
            // Wave images cycle by index — white copy over the art, as on the banners.
            const image = FEATURE_CARD_IMAGES[idx % FEATURE_CARD_IMAGES.length];
            return (
              <div
                key={card.tag}
                className={`${isDesktopWeb ? "w-[calc(50%-9px)] min-w-[calc(50%-9px)]" : "w-full min-w-full"} rounded-card premium-shadow-sm group/media relative flex h-[300px] snap-start flex-col justify-between overflow-hidden p-7 text-white`}
              >
                <div
                  className="pointer-events-none absolute -inset-px bg-cover bg-center transition-transform duration-700 ease-out group-hover/media:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover/media:scale-100"
                  style={{ backgroundImage: `url(${image})` }}
                />
                <div className="relative z-10 space-y-2.5">
                  <span className="block text-xs font-medium tracking-widest text-white uppercase">
                    {card.tag}
                  </span>
                  <h3 className="font-geist text-xl leading-snug font-medium">
                    {card.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-white">
                    {card.desc}
                  </p>
                </div>
                <button
                  onClick={() => onAction(card)}
                  className="relative z-10 flex w-fit items-center gap-3 rounded-full bg-white py-1.5 pr-1.5 pl-5 text-sm font-medium text-[#0A1F4D] transition-all active:scale-95"
                >
                  {card.cta}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#97edcc]">
                    <ArrowRight
                      size={15}
                      className="text-[#0A1F4D]"
                    />
                  </span>
                </button>
              </div>
            );
          })}
        </div>
        <CarouselDots
          containerRef={scrollRef}
          count={FEATURE_CARDS.length}
          variant="counter"
          className="absolute top-4 right-4 z-20"
        />
      </div>
    </section>
  );
}
