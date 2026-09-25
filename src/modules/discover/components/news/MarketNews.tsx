"use client";

import { Newspaper } from "lucide-react";
import FeatureHeader from "@/components/discover/FeatureHeader";
import { PageLoaderSwitch } from "@/components/shared/PageLoader";
import { BANNER_WAVE, SectionBanner } from "@/components/shared/SectionKit";
import { useMemo } from "react";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import {
  fetchMarketNewsPage,
  type MarketNewsItem,
  newsAskPrompt,
} from "../../api/market-news";
import { useMarketNewsFirstPage } from "../../hooks/useMarketNews";
import { useNewsFeed } from "../../hooks/useNewsFeed";
import { newsBannerTitle } from "../../utils/banner-titles";
import type { NewsFeedPage } from "../../utils/news-feed";
import { FeatureEmptyState, RetryErrorState } from "../shared/FeatureStates";
import { PagedNewsList } from "./PagedNewsList";

const toFeedPage = (page: {
  items: MarketNewsItem[];
  nextPage: number | null;
}): NewsFeedPage<number> => ({ items: page.items, next: page.nextPage });

const fetchFeedPage = async (page: number) =>
  toFeedPage(await fetchMarketNewsPage(page));

/**
 * Discover → News Impact: the real Nifty 50 headline feed, as a vertical list.
 * This replaces the invented topic graph that used to sit behind the row
 * (T-04/T-06) — the mock it fronted is deleted, not hidden.
 *
 * There is no story screen: a card asks the analyst about the headline, and
 * the `source • time` label opens the publisher. That is the whole feature,
 * exactly as in finsharpe-mobile.
 *
 * Since #174 the page is the whole tape rather than Home's eight: it loads as
 * you scroll (`PagedNewsList`), at most 2 cards per company on each page, and
 * Home's See all opens it too. The banner counts page 1 only, so its number
 * holds still as the list grows.
 */

export function MarketNews({ onBack }: { onBack: () => void }) {
  const { createNewChat } = useAppNavigation();
  const { data, isError, isPending, refetch } = useMarketNewsFirstPage();
  const first = useMemo(() => (data ? toFeedPage(data) : undefined), [data]);
  const { feed, loadMore } = useNewsFeed(first, fetchFeedPage);

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
  } else if (isPending || !feed) {
    // The feed is the whole page, so its first load is a full-page wait under
    // the header — Home, where the same cards are one section of many, keeps
    // the skeletons instead.
    // Drawn by the PageLoaderSwitch below.
    body = null;
  } else if (feed.items.length === 0 && feed.foot === "end") {
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
      <PagedNewsList
        feed={feed}
        onMore={loadMore}
        onAsk={ask}
        banner={
          <SectionBanner
            eyebrow="Stay informed"
            title={newsBannerTitle(feed.items.slice(0, feed.firstPageCount))}
            tone="mint"
            height={260}
            image={BANNER_WAVE.sky}
            imageScrim
          />
        }
        endNote={{
          title: "That's all the headlines for now.",
          detail: "The feed refreshes through the day.",
        }}
        showMoreLabel="Show more headlines"
      />
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
