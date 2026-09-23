"use client";

import { ArrowRight } from "lucide-react";
import {
  canOpenLink,
  type MarketNewsItem,
  type NewsTone,
} from "../../api/market-news";
import { relativeTime } from "../../utils/relative-time";
import { ChipTone, SkeletonBlock, StatusChip } from "../shared/FeedKit";

/**
 * One headline, drawn the same on Home's carousel and on the news page —
 * finsharpe-mobile's `NewsCard` (`presentation/market_news_section.dart`), so
 * a headline cannot read one way there and another here.
 *
 * Top to bottom: the kicker (tagged symbol opposite the sentiment badge); the
 * headline, two lines; the served company name where a summary would sit — the
 * feed carries no summary, and nothing here invents one; then a hairline
 * footer, `source • time` on the left and `Ask AI →` on the right.
 *
 * Two targets. The card, tapped anywhere including the "Ask AI" label, asks
 * the analyst about the headline. The `source • time` label is its own link
 * when the item carries one the browser can open.
 */

const TONE_CHIPS: Record<NewsTone, ChipTone> = {
  positive: "positive",
  negative: "negative",
  neutral: "neutral",
};

/** Publisher and time, either of which the payload may be missing. */
const newsMetaLine = (item: MarketNewsItem) =>
  [item.source, item.publishedAt ? relativeTime(item.publishedAt) : null]
    .filter(Boolean)
    .join(" • ");

const CARD_WIDTH = 270;
const CARD_HEIGHT = 200;

export function NewsCard({
  item,
  onAsk,
  fixedHeight = false,
}: {
  item: MarketNewsItem;
  onAsk: (item: MarketNewsItem) => void;
  /** Home's carousel shares one height, so the footer pins to the bottom. */
  fixedHeight?: boolean;
}) {
  const meta = newsMetaLine(item);
  const link = canOpenLink(item.link) ? item.link : null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${item.title}. Ask AI.`}
      onClick={() => onAsk(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAsk(item);
        }
      }}
      style={
        fixedHeight ? { width: CARD_WIDTH, height: CARD_HEIGHT } : undefined
      }
      className={`glass-card rounded-card premium-shadow-sm hover-tint flex shrink-0 cursor-pointer flex-col px-5 pt-5 transition-colors ${fixedHeight ? "snap-start" : "w-full"}`}
    >
      <div className={fixedHeight ? "min-h-0 flex-1 overflow-hidden" : ""}>
        {/* Kicker: a headline with no tagged symbol still needs an eyebrow, and
            "Markets" is the honest general-feed label. */}
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[10px] font-medium tracking-wider text-slate-400 uppercase">
            {(item.symbol ?? "Markets").toUpperCase()}
          </span>
          {item.sentimentLabel && (
            <StatusChip
              label={item.sentimentLabel}
              tone={TONE_CHIPS[item.tone]}
            />
          )}
        </div>

        <h4 className="font-geist mt-2 line-clamp-2 text-[13px] leading-[1.375] font-medium text-[#0A1F4D]">
          {item.title}
        </h4>

        {item.company && (
          <p className="mt-2 line-clamp-2 text-[11px] leading-[1.45] text-slate-500">
            {item.company}
          </p>
        )}
      </div>

      <div
        className={`border-t border-slate-100 ${fixedHeight ? "mt-2" : "mt-3"}`}
      >
        <div className="flex h-11 items-center gap-2">
          {meta && link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer noopener"
              onClick={(e) => e.stopPropagation()}
              title={`Read at ${item.source ?? "the publisher"}`}
              className="min-w-0 flex-1 truncate text-[10px] text-slate-400 underline-offset-2 hover:underline"
            >
              {meta}
            </a>
          ) : (
            <span className="min-w-0 flex-1 truncate text-[10px] text-slate-400">
              {meta}
            </span>
          )}
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-[#063BAA]">
            Ask AI <ArrowRight size={10} />
          </span>
        </div>
      </div>
    </div>
  );
}

/** A card-shaped wait, in the stacked (news page) proportions. */
export function NewsCardSkeleton({
  fixedHeight = false,
}: {
  fixedHeight?: boolean;
}) {
  return (
    <div
      style={
        fixedHeight ? { width: CARD_WIDTH, height: CARD_HEIGHT } : undefined
      }
      className={`glass-card rounded-card flex shrink-0 flex-col gap-3 p-5 ${fixedHeight ? "" : "w-full"}`}
    >
      <SkeletonBlock width={64} />
      <SkeletonBlock height={12} />
      <SkeletonBlock
        width={180}
        height={12}
      />
      <div className="flex-1" />
      <SkeletonBlock width={100} />
    </div>
  );
}
