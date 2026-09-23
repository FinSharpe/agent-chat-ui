"use client";

import { Newspaper } from "lucide-react";
import FeatureHeader from "@/components/discover/FeatureHeader";
import { PageLoaderSwitch } from "@/components/shared/PageLoader";
import { BANNER_WAVE, SectionBanner } from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { type MarketNewsItem, newsAskPrompt } from "../../api/market-news";
import { useMarketNews } from "../../hooks/useMarketNews";
import { newsBannerTitle } from "../../utils/banner-titles";
import { FeatureEmptyState, RetryErrorState } from "../shared/FeatureStates";
import { NewsCard } from "./NewsCard";

/**
 * Discover → News Impact: the real Nifty 50 headline feed, as a vertical list.
 * This replaces the invented topic graph that used to sit behind the row
 * (T-04/T-06) — the mock it fronted is deleted, not hidden.
 *
 * There is no story screen: a card asks the analyst about the headline, and
 * the `source • time` label opens the publisher. That is the whole feature,
 * exactly as in finsharpe-mobile.
 */

export function MarketNews({ onBack }: { onBack: () => void }) {
  const isDesktopWeb = useIsDesktopWeb();
  const { createNewChat } = useAppNavigation();
  const { data, isError, isPending, refetch } = useMarketNews();

  const ask = (item: MarketNewsItem) =>
    createNewChat(newsAskPrompt(item.title));

  let body: React.ReactNode;
  if (isError) {
    body = (
      <RetryErrorState
        icon={<Newspaper size={22} />}
        title="Could not load the news"
        message="The market feed did not answer. Check your connection and try again."
        onRetry={() => refetch()}
      />
    );
  } else if (isPending) {
    // The feed is the whole page, so its first load is a full-page wait under
    // the header — Home, where the same cards are one section of many, keeps
    // the skeletons instead.
    // Drawn by the PageLoaderSwitch below.
    body = null;
  } else if (data.length === 0) {
    body = (
      <FeatureEmptyState
        icon={<Newspaper size={22} />}
        title="No headlines right now"
        message="The market feed is quiet. It refreshes through the day, so there will be more here later."
        actionLabel="Back to Discover"
        onAction={onBack}
      />
    );
  } else {
    body = (
      <div
        className={`scrollbar-none flex-1 space-y-12 overflow-y-auto px-5 py-5 ${isDesktopWeb ? "pb-16" : "pb-[130px]"}`}
      >
        <SectionBanner
          eyebrow="Stay informed"
          title={newsBannerTitle(data)}
          tone="mint"
          height={260}
          image={BANNER_WAVE.sky}
          imageScrim
        />
        {/* No section label: the header above already names the feed, and a
            page that titles itself twice reads as two things. */}
        <div className="space-y-3">
          {data.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              onAsk={ask}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      <FeatureHeader
        title="Market news"
        subtitle="Nifty 50 headlines"
        onBack={onBack}
      />
      <PageLoaderSwitch loading={isPending && !isError}>
        {body}
      </PageLoaderSwitch>
    </div>
  );
}
