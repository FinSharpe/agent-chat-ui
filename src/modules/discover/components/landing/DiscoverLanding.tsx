"use client";

import {
  BANNER_WAVE,
  ListRow,
  ScreenFooter,
  SectionBanner,
  SectionLabel,
} from "@/components/shared/SectionKit";
import { discoverNavCards } from "../../constants/discover-nav";
import { DiscoverFeature } from "../../types/discover.types";

const TAGLINE = "Sail toward smarter decisions.";

function FeatureRows({
  cards,
  onOpen,
}: {
  cards: typeof discoverNavCards;
  onOpen: (id: DiscoverFeature) => void;
}) {
  return (
    <div>
      {cards.map((card, idx) => {
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
 * Discover's landing: an intro banner, the three live features, an "Up Next"
 * breaker, the coming-soon features, and the wave footer.
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
          <FeatureRows
            cards={discoverNavCards.slice(0, 3)}
            onOpen={onOpen}
          />
        </div>

        {/* Breaker card introducing the not-yet-live section below it. */}
        <SectionBanner
          eyebrow="Up Next"
          title="Build portfolios, trade ideas, invest globally."
          tone="mint"
          height={260}
          image="/graphics/up-next.jpg"
          imageScrim
        />

        <div className="space-y-2">
          <SectionLabel className="pl-1">Coming Soon</SectionLabel>
          <FeatureRows
            cards={discoverNavCards.slice(3)}
            onOpen={onOpen}
          />
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
