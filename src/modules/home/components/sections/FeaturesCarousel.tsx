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
          className={`flex overflow-x-auto snap-x snap-mandatory ${isDesktopWeb ? "gap-4.5" : "gap-3"} scrollbar-none pb-1`}
        >
          {FEATURE_CARDS.map((card, idx) => {
            // Wave images cycle by index — white copy over the art, as on the banners.
            const image = FEATURE_CARD_IMAGES[idx % FEATURE_CARD_IMAGES.length];
            return (
              <div
                key={card.tag}
                className={`${isDesktopWeb ? "min-w-[calc(50%-9px)] w-[calc(50%-9px)]" : "min-w-full w-full"} rounded-card p-7 snap-start flex flex-col justify-between h-[300px] relative overflow-hidden premium-shadow-sm text-white group/media`}
              >
                <div
                  className="absolute -inset-px pointer-events-none bg-cover bg-center transition-transform duration-700 ease-out group-hover/media:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover/media:scale-100"
                  style={{ backgroundImage: `url(${image})` }}
                />
                <div className="space-y-2.5 relative z-10">
                  <span className="text-xs uppercase tracking-widest font-medium block text-white">
                    {card.tag}
                  </span>
                  <h3 className="text-xl font-geist font-medium leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-white">
                    {card.desc}
                  </p>
                </div>
                <button
                  onClick={() => onAction(card)}
                  className="pl-5 pr-1.5 py-1.5 rounded-full text-sm font-medium w-fit flex items-center gap-3 transition-all active:scale-95 relative z-10 bg-white text-[#0A1F4D]"
                >
                  {card.cta}
                  <span className="w-8 h-8 rounded-full bg-[#97edcc] flex items-center justify-center shrink-0">
                    <ArrowRight size={15} className="text-[#0A1F4D]" />
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
