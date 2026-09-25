"use client";

import { useEffect, useRef, type ReactNode } from "react";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import type { MarketNewsItem } from "../../api/market-news";
import type { NewsFeedState } from "../../utils/news-feed";
import { softButton } from "../shared/FeatureStates";
import { NewsCard, NewsCardSkeleton } from "./NewsCard";

/**
 * A news list that loads as you scroll: Holdings news and Discover's Market
 * news — finsharpe-mobile's `PagedNewsList` (#174); change the two together.
 *
 * [banner] opens the page, the cards follow 12 apart — the app's one
 * `NewsCard` — and under the last card, whatever [feed] says is next: nothing
 * while there is more (the next page is asked for about a screen from the
 * bottom), a skeleton card while it loads, Try again when it failed, a Show
 * more button after a run of empty pages, or [endNote].
 */
export function PagedNewsList({
  feed,
  onMore,
  onAsk,
  banner,
  endNote,
  showMoreLabel,
}: {
  feed: NewsFeedState;
  onMore: () => void;
  onAsk: (item: MarketNewsItem) => void;
  banner: ReactNode;
  endNote: { title: string; detail?: string | null };
  showMoreLabel: string;
}) {
  const isDesktopWeb = useIsDesktopWeb();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const nearEnd = useRef(false);
  const onMoreRef = useRef(onMore);
  onMoreRef.current = feed.foot === "more" ? onMore : () => {};

  // Within a screen of the bottom: ask for more. The observer only reports a
  // change, so the effect below also asks after every page that lands with
  // the end still in reach — a page too short to scroll still leads on.
  useEffect(() => {
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        nearEnd.current = entry.isIntersecting;
        if (entry.isIntersecting) onMoreRef.current();
      },
      { root, rootMargin: "0px 0px 100% 0px" },
    );
    io.observe(target);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (feed.foot === "more" && nearEnd.current) onMore();
  }, [feed.foot, feed.items.length, onMore]);

  return (
    <div
      ref={scrollRef}
      className={`scrollbar-none flex-1 overflow-y-auto px-5 py-5 ${isDesktopWeb ? "pb-16" : "pb-[130px]"}`}
    >
      {banner}
      <div className="mt-12 space-y-3">
        {feed.items.map((item) => (
          <NewsCard
            key={item.id}
            item={item}
            onAsk={onAsk}
          />
        ))}
        <Foot
          feed={feed}
          onMore={onMore}
          endNote={endNote}
          showMoreLabel={showMoreLabel}
        />
      </div>
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="h-px"
      />
    </div>
  );
}

function Foot({
  feed,
  onMore,
  endNote,
  showMoreLabel,
}: {
  feed: NewsFeedState;
  onMore: () => void;
  endNote: { title: string; detail?: string | null };
  showMoreLabel: string;
}) {
  switch (feed.foot) {
    case "more":
      return <div className="h-2" />;
    case "loading":
      return (
        <div
          role="status"
          aria-label="Loading more news"
        >
          <NewsCardSkeleton />
        </div>
      );
    case "failed":
      return (
        <div className="space-y-3 px-3 pt-2 pb-2 text-center">
          <p className="text-xs leading-[1.45] text-slate-500">
            Couldn&apos;t load more news. Check your connection and try again.
          </p>
          <button
            onClick={onMore}
            className={softButton}
          >
            Try again
          </button>
        </div>
      );
    case "stalled":
      return (
        <div className="flex justify-center pt-1">
          <button
            onClick={onMore}
            className={softButton}
          >
            {showMoreLabel}
          </button>
        </div>
      );
    case "end":
      return (
        <div className="space-y-1.5 px-3 pt-4 pb-2 text-center text-xs leading-[1.45]">
          <p className="font-medium text-[#0A1F4D]">{endNote.title}</p>
          {endNote.detail && <p className="text-slate-400">{endNote.detail}</p>}
        </div>
      );
  }
}
