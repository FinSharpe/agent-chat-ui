"use client";

import {
  newsNudgeApiNudgesNewsPost,
  useNewsNudgeApiNudgesNewsPost,
} from "@/api/generated/nudge-apis/nudge-apis/nudge-apis";
import type { NewsNudgeResponse } from "@/api/generated/nudge-apis/models";
import FeatureHeader from "@/components/discover/FeatureHeader";
import { PageLoaderSwitch } from "@/components/shared/PageLoader";
import { BANNER_WAVE, SectionBanner } from "@/components/shared/SectionKit";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { newsAskPrompt } from "@/modules/discover/api/market-news";
import { PagedNewsList } from "@/modules/discover/components/news/PagedNewsList";
import { RetryErrorState } from "@/modules/discover/components/shared/FeatureStates";
import { useNewsFeed } from "@/modules/discover/hooks/useNewsFeed";
import type { NewsFeedPage } from "@/modules/discover/utils/news-feed";
import { Newspaper } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { IMPORT_ROUTE } from "../../constants/routes";
import {
  holdingsNewsItem,
  holdingsNewsSubtitle,
  quietHoldingLabel,
  quietHoldingsLine,
} from "../../utils/holdings-news";
import { useNudge } from "./useNudge";
import { usePortfolioHoldings } from "./usePortfolioHoldings";

const toFeedPage = (page: NewsNudgeResponse): NewsFeedPage<string> => ({
  items: (page.articles ?? []).map(holdingsNewsItem),
  next: page.nextCursor ?? null,
  quiet: (page.quietHoldings ?? []).map(quietHoldingLabel),
});

const EMPTY_PAGE: NewsFeedPage<string> = { items: [], next: null, quiet: [] };

/**
 * Holdings news (#174): every article the Import News row has behind it, one
 * flat list in the order it is served, loading as you scroll —
 * finsharpe-mobile's `HoldingsNewsScreen`; change the two together.
 *
 * Page 1 is the row's own request (same body, same cache entry), so the list
 * opens with no wait when the row has loaded; later pages send that body
 * again with the cursor. Each page takes turns across the holdings, so every
 * card names its stock in the kicker. The end names the holdings that had
 * nothing, which only the server knows: it picked them.
 */
export function HoldingsNewsPage() {
  const isDesktopWeb = useIsDesktopWeb();
  const router = useRouter();
  const { createNewChat } = useAppNavigation();
  const portfolio = usePortfolioHoldings();
  const holdingsReady = !portfolio.isLoading;

  const news = useNudge<NewsNudgeResponse>(
    useNewsNudgeApiNudgesNewsPost,
    newsNudgeApiNudgesNewsPost,
    portfolio.deepDiveHoldings,
    holdingsReady && portfolio.hasEquity,
  );

  // With no equities there is no feed to read: the list is empty, and ends.
  const first = useMemo(() => {
    if (holdingsReady && !portfolio.hasEquity) return EMPTY_PAGE;
    return news.data ? toFeedPage(news.data) : undefined;
  }, [holdingsReady, portfolio.hasEquity, news.data]);

  const { body } = news;
  const { feed, loadMore } = useNewsFeed(first, async (cursor: string) => {
    const res = await newsNudgeApiNudgesNewsPost({ ...body, cursor });
    if (res.status >= 400) throw new Error(`holdings news ${res.status}`);
    return toFeedPage(res.data as NewsNudgeResponse);
  });

  const leave = () =>
    window.history.length > 1 ? router.back() : router.push(IMPORT_ROUTE);

  let content: React.ReactNode = null;
  if (news.isError) {
    content = (
      <RetryErrorState
        icon={<Newspaper size={22} />}
        title="Could not load the news"
        message="The news on your holdings did not load. Check your connection and try again."
        onRetry={news.retry}
      />
    );
  } else if (feed) {
    content = (
      <PagedNewsList
        feed={feed}
        onMore={loadMore}
        onAsk={(item) => createNewChat(newsAskPrompt(item.title))}
        banner={
          <SectionBanner
            eyebrow="Deep Dive"
            title="Each of your largest holdings takes a turn in the headlines"
            tone="mint"
            height={260}
            image={BANNER_WAVE.royal}
            imageScrim
          />
        }
        endNote={{
          title: "That's all from the last 7 days.",
          detail: quietHoldingsLine(feed.quiet),
        }}
        showMoreLabel="Show more news"
      />
    );
  }

  return (
    <div className="font-funnel relative flex h-full w-full flex-1 flex-col overflow-hidden bg-transparent">
      <div
        className={
          isDesktopWeb
            ? "mx-auto flex h-full min-h-0 w-full max-w-[calc(804px*var(--wx,1))] flex-col"
            : "flex h-full min-h-0 flex-col"
        }
      >
        <FeatureHeader
          title="Holdings news"
          subtitle={holdingsNewsSubtitle(news.data?.totalHoldings ?? 0)}
          onBack={leave}
        />
        <PageLoaderSwitch loading={!feed && !news.isError}>
          {content}
        </PageLoaderSwitch>
      </div>
    </div>
  );
}
