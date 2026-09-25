"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  BANNER_WAVE,
  ScreenFooter,
  SectionBanner,
} from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { NEWS_BANNER_FALLBACK } from "@/modules/discover/utils/banner-titles";
import { HOME_TAGLINE } from "../constants/features";
import type { LearnVideo, ResearchArticle } from "../constants/learn";
import { useHomeActions } from "../hooks/useHomeActions";
import { GuideOverlay } from "./modals/GuideOverlay";
import { PublicationReader } from "./modals/PublicationReader";
import { VideoDetail } from "./modals/VideoDetail";
import { FeaturesCarousel } from "./sections/FeaturesCarousel";
import { MarketNewsRow } from "./sections/MarketNewsRow";
import { PublicationsRow } from "./sections/PublicationsRow";
import { StarterQuestions } from "./sections/StarterQuestions";
import { WatchAndLearnRow } from "./sections/WatchAndLearnRow";
import { WhatYouCanDo } from "./sections/WhatYouCanDo";

/**
 * Home — features carousel, orientation cards, starter prompts, the live
 * market-news carousel, FinSharpe Publications and Watch & Learn, closed by
 * the wave footer. Mobile is a single padded
 * column; desktop centres an 844px column and runs the footer edge to edge.
 * The guide, publication reader and video detail live at the root, outside
 * the scroller, so they cover the screen wherever the user has scrolled to.
 *
 * Everything on this page either seeds a real chat, routes to a real tab,
 * draws the real `/api/news/market` feed, or opens a real FinSharpe article
 * or talk (finsharpe-mobile's curated lists, `constants/learn.ts`).
 * The reference's invented publications and videos stay gone (T-03), as does
 * Personal Intelligence; linked accounts are managed on Import.
 */
export function HomePage() {
  const isDesktopWeb = useIsDesktopWeb();
  const router = useRouter();
  const [showGuide, setShowGuide] = useState(false);
  const [article, setArticle] = useState<ResearchArticle | null>(null);
  const [video, setVideo] = useState<LearnVideo | null>(null);

  const openGuide = useCallback(() => setShowGuide(true), []);
  const { askAi, runAction } = useHomeActions(openGuide);

  return (
    <div className="font-funnel relative flex h-full w-full flex-1 flex-col overflow-hidden">
      <div
        className={`scrollbar-none absolute inset-0 overflow-y-auto ${isDesktopWeb ? "" : "px-5 pt-5 pb-4"}`}
      >
        <div
          className={
            isDesktopWeb
              ? "mx-auto w-full max-w-[calc(844px*var(--wx,1)_+_6px)] space-y-12 px-10 pt-[52px] pb-20"
              : "space-y-12"
          }
        >
          <FeaturesCarousel onAction={runAction} />

          <WhatYouCanDo onAction={runAction} />

          <StarterQuestions onAsk={askAi} />

          {/* Separator banner, previewing the news carousel right below it.
              Shares its sentence with Discover's news banner so the two can
              never drift apart. */}
          <SectionBanner
            eyebrow="Stay informed"
            title={NEWS_BANNER_FALLBACK}
            tone="mint"
            height={260}
            image={BANNER_WAVE.cyan}
            imageScrim
          />

          <MarketNewsRow
            onAsk={askAi}
            onSeeAll={() => router.push("/discover?feature=news")}
          />

          <PublicationsRow onOpen={setArticle} />

          <WatchAndLearnRow onOpen={setVideo} />

          {!isDesktopWeb && <ScreenFooter tagline={HOME_TAGLINE} />}
        </div>
        {isDesktopWeb && (
          <ScreenFooter
            wide
            tagline={HOME_TAGLINE}
          />
        )}
      </div>

      <AnimatePresence>
        {showGuide && <GuideOverlay onClose={() => setShowGuide(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {article && (
          <PublicationReader
            key={article.url}
            article={article}
            onClose={() => setArticle(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {video && (
          <VideoDetail
            key={video.id}
            video={video}
            onClose={() => setVideo(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
