"use client";

import { useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  BANNER_WAVE,
  ScreenFooter,
  SectionBanner,
} from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { HOME_TAGLINE } from "../constants/features";
import { useHomeActions } from "../hooks/useHomeActions";
import { useLinkedAccounts } from "../hooks/useLinkedAccounts";
import type { HomeVideo, Publication } from "../types/home.types";
import { GuideOverlay } from "./modals/GuideOverlay";
import { PublicationReader } from "./modals/PublicationReader";
import { VideoDetail } from "./modals/VideoDetail";
import { FeaturesCarousel } from "./sections/FeaturesCarousel";
import { MarketNewsRow } from "./sections/MarketNewsRow";
import { PersonalIntelligence } from "./sections/PersonalIntelligence";
import { PublicationFeed } from "./sections/PublicationFeed";
import { StarterQuestions } from "./sections/StarterQuestions";
import { WatchAndLearn } from "./sections/WatchAndLearn";
import { WhatYouCanDo } from "./sections/WhatYouCanDo";

/**
 * Home — features carousel, orientation cards, starter prompts, news,
 * publications and videos, closed by the wave footer. Mobile is a single
 * padded column; desktop centres an 844px column and runs the footer edge to
 * edge. Detail views (video, publication, guide) are popups on desktop and
 * full-screen sheets on mobile; they live at the root, outside the scroller,
 * so they cover the screen wherever the user has scrolled to.
 */
export function HomePage() {
  const isDesktopWeb = useIsDesktopWeb();
  const [showGuide, setShowGuide] = useState(false);
  const [video, setVideo] = useState<HomeVideo | null>(null);
  const [publication, setPublication] = useState<Publication | null>(null);

  const openGuide = useCallback(() => setShowGuide(true), []);
  const { askAi, runAction, setActiveTab } = useHomeActions(openGuide);
  const { linked, missing, state: connection } = useLinkedAccounts();

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col font-funnel">
      <div
        className={`absolute inset-0 overflow-y-auto scrollbar-none ${isDesktopWeb ? "" : "px-5 pt-5 pb-4"}`}
      >
        <div
          className={
            isDesktopWeb
              ? "mx-auto w-full max-w-[calc(844px*var(--wx,1)_+_6px)] px-10 pt-[52px] pb-20 space-y-12"
              : "space-y-12"
          }
        >
          <FeaturesCarousel onAction={runAction} />

          {connection !== "new_user" && (
            <PersonalIntelligence
              linked={linked}
              missing={missing}
              onAsk={askAi}
              onOpenImport={() => setActiveTab("import")}
            />
          )}

          <WhatYouCanDo onAction={runAction} />

          <SectionBanner
            eyebrow="Did you know"
            title="FinSharpeGPT studies 1M+ parameters before it answers you"
            tone="blue"
            height={260}
            image="/graphics/did-you-know.jpg"
            imageScrim
          />

          <StarterQuestions
            label={connection === "new_user" ? "Start with Chat" : "Starter Questions"}
            onAsk={askAi}
          />

          <SectionBanner
            eyebrow="Stay informed"
            title="The biggest market headlines, decoded and curated daily"
            tone="mint"
            height={260}
            image={BANNER_WAVE.cyan}
            imageScrim
          />

          <MarketNewsRow onAsk={askAi} />
          <PublicationFeed onOpen={setPublication} />
          <WatchAndLearn onOpen={setVideo} />

          {!isDesktopWeb && <ScreenFooter tagline={HOME_TAGLINE} />}
        </div>
        {isDesktopWeb && <ScreenFooter wide tagline={HOME_TAGLINE} />}
      </div>

      <AnimatePresence>
        {video && <VideoDetail video={video} onClose={() => setVideo(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {publication && (
          <PublicationReader p={publication} onClose={() => setPublication(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showGuide && <GuideOverlay onClose={() => setShowGuide(false)} />}
      </AnimatePresence>
    </div>
  );
}
