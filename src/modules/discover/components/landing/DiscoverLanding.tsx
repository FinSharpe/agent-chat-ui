"use client";

import type { LucideIcon } from "lucide-react";
import {
  BANNER_WAVE,
  ListRow,
  ScreenFooter,
  SectionBanner,
  SectionLabel,
} from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import {
  discoverComingSoonCards,
  discoverNavCards,
} from "../../constants/discover-nav";
import { DiscoverFeature } from "../../types/discover.types";

const TAGLINE = "Sail toward smarter decisions.";

function FeatureRows({ onOpen }: { onOpen: (id: DiscoverFeature) => void }) {
  return (
    <div>
      {discoverNavCards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <ListRow
            key={card.id}
            icon={<Icon size={20} />}
            title={card.title}
            sub={card.subtitle}
            tone={idx}
            onClick={() => onOpen(card.id)}
          />
        );
      })}
    </div>
  );
}

/**
 * A row for something that is not built yet: the same shape as {@link ListRow}
 * so the list still reads as one list, but muted, inert, and closed by a
 * "Coming soon" chip where the arrow would be. Not a button — there is
 * nothing behind it, and a tap that did nothing would read as broken.
 */
function ComingSoonRow({
  icon: Icon,
  title,
  sub,
  last,
}: {
  icon: LucideIcon;
  title: string;
  sub: string;
  last: boolean;
}) {
  const isDesktopWeb = useIsDesktopWeb();
  return (
    <div
      aria-disabled="true"
      className={`flex w-full cursor-default items-center gap-3.5 py-3.5 text-left select-none ${
        isDesktopWeb
          ? `relative ${last ? "" : "after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:bg-slate-100 dark:after:bg-slate-800/60"}`
          : `${last ? "" : "border-b border-slate-100"}`
      }`}
    >
      <span className="rounded-tile flex h-10 w-10 shrink-0 items-center justify-center bg-slate-100 text-slate-400 opacity-60">
        <Icon size={20} />
      </span>
      <span className="min-w-0 flex-1 opacity-60">
        <span className="block text-[13px] leading-snug font-medium text-[#0A1F4D]">
          {title}
        </span>
        <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
          {sub}
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-medium tracking-wider text-slate-500 uppercase">
        Coming soon
      </span>
    </div>
  );
}

/**
 * Discover's landing: an intro banner, the live features, an "Up Next"
 * breaker, the not-yet-built features as disabled rows, and the wave footer.
 */
export function DiscoverLanding({
  isDesktopWeb,
  onOpen,
}: {
  isDesktopWeb: boolean;
  onOpen: (id: DiscoverFeature) => void;
}) {
  return (
    <>
      <div
        className={
          isDesktopWeb
            ? "mx-auto w-full max-w-[calc(844px*var(--wx,1)_+_6px)] space-y-12 px-10 pt-[52px] pb-20"
            : "space-y-12"
        }
      >
        <SectionBanner
          eyebrow="Explore"
          title="More ways to build, explore and invest in your ideas"
          tone="mint"
          height={260}
          image={BANNER_WAVE.royal}
          imageScrim
        />

        <div className="space-y-2">
          <FeatureRows onOpen={onOpen} />
        </div>

        {/* Breaker card introducing the not-yet-live section below it. */}
        <SectionBanner
          eyebrow="Up Next"
          title="Trade ideas and global markets, still in the works."
          tone="mint"
          height={260}
          image="/graphics/up-next.jpg"
          imageScrim
        />

        <div className="space-y-2">
          <SectionLabel className="pl-1">Coming Soon</SectionLabel>
          <div>
            {discoverComingSoonCards.map((card, idx) => (
              <ComingSoonRow
                key={card.id}
                icon={card.icon}
                title={card.title}
                sub={card.subtitle}
                last={idx === discoverComingSoonCards.length - 1}
              />
            ))}
          </div>
        </div>

        {!isDesktopWeb && <ScreenFooter tagline={TAGLINE} />}
      </div>
      {isDesktopWeb && (
        <ScreenFooter
          wide
          tagline={TAGLINE}
        />
      )}
    </>
  );
}
