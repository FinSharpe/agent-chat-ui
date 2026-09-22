"use client";

import { SectionLabel } from "@/components/shared/SectionKit";
import { newsAskPrompt } from "@/modules/discover/api/market-news";
import {
  NewsCard,
  NewsCardSkeleton,
} from "@/modules/discover/components/news/NewsCard";
import { useMarketNews } from "@/modules/discover/hooks/useMarketNews";

/**
 * Home's news section, on the real `GET /api/news/market` feed (T-06) — the
 * same card the Discover news page draws, in the horizontal snap carousel
 * finsharpe-mobile mounts on Home. Fixed 270×200 cards, 12px apart, no dots.
 *
 * Where the feed is a browse extra rather than the point of the surface, a
 * failure or an empty page hides the section rather than showing an error the
 * reader can do nothing about. The news page, where the feed *is* the subject,
 * says both out loud instead.
 */
export function MarketNewsRow({ onAsk }: { onAsk: (prompt: string) => void }) {
  const { data, isError } = useMarketNews();

  if (isError || data?.length === 0) return null;

  return (
    <section className="space-y-3 select-none">
      <SectionLabel className="pl-1">Latest Market News</SectionLabel>
      <div className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
        {data
          ? data.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                onAsk={(news) => onAsk(newsAskPrompt(news.title))}
                fixedHeight
              />
            ))
          : [0, 1].map((i) => (
              <NewsCardSkeleton
                key={i}
                fixedHeight
              />
            ))}
      </div>
    </section>
  );
}
