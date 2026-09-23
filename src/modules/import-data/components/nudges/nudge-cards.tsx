"use client";

import type {
  BadgeTone,
  FundamentalCard,
  NewsArticle,
  NudgeBadge,
  TechnicalCard,
} from "@/api/generated/nudge-apis/models";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

/* The reference Import screen's Smart Alerts cards, filled from the nudge
   APIs. Sentiment is the one place colour carries meaning, so a badge's tone
   picks the pill colours and nothing else does. */

const TONE_PILL: Record<BadgeTone, string> = {
  positive:
    "bg-[#97edcc]/25 text-[#0A9E6E] dark:bg-emerald-500/10 dark:text-emerald-400",
  neutral:
    "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  negative: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
};

const toneOf = (badge?: NudgeBadge | null): BadgeTone =>
  (badge?.tone as BadgeTone) ?? "neutral";

const tickerOf = (h: {
  symbol?: string | null;
  name?: string | null;
  isin: string;
}) => h.symbol || h.name || h.isin;

const fmt = (n: number | null | undefined, digits = 1) =>
  n == null
    ? null
    : n.toLocaleString("en-IN", { maximumFractionDigits: digits });

/* ------------------------- Row (News / Technical / Fundamental) ------------------------- */

interface AlertCardProps {
  width: string;
  ticker: string;
  badge?: NudgeBadge | null;
  title: string;
  desc?: string | null;
  meta?: string | null;
  action?: ReactNode;
  /** News has no description line, so its headline may run a line longer. */
  titleLines?: 2 | 3;
}

/** News / Technical / Fundamental card — same shape as Home's market news. */
function AlertCard({
  width,
  ticker,
  badge,
  title,
  desc,
  meta,
  action,
  titleLines = 2,
}: AlertCardProps) {
  return (
    <div
      className={`${width} glass-card premium-shadow-sm rounded-card flex snap-start flex-col justify-between gap-3 p-5`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[10px] font-medium tracking-wider text-slate-400 uppercase">
            {ticker}
          </span>
          {badge && (
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-medium tracking-wider uppercase ${TONE_PILL[toneOf(badge)]}`}
            >
              {badge.label}
            </span>
          )}
        </div>
        <h4
          className={`font-geist text-[13px] leading-snug font-medium text-[#0A1F4D] dark:text-white ${titleLines === 3 ? "line-clamp-3" : "line-clamp-2"}`}
        >
          {title}
        </h4>
        {desc && (
          <p className="line-clamp-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            {desc}
          </p>
        )}
      </div>
      <div className="font-funnel mt-2 flex items-center justify-between gap-2 border-t border-slate-50 pt-2.5 text-[10px] text-slate-400 dark:border-slate-800/60">
        <span className="truncate">{meta}</span>
        {action}
      </div>
    </div>
  );
}

export function NewsCard({
  article,
  width,
  onDiscuss,
}: {
  article: NewsArticle;
  width: string;
  onDiscuss: (prompt: string) => void;
}) {
  const ticker = article.symbol || "Market";
  const actionClass =
    "flex shrink-0 items-center gap-1 font-medium text-[#063BAA] dark:text-[#8FB4FF]";
  return (
    <AlertCard
      width={width}
      ticker={ticker}
      badge={article.sentiment}
      title={article.title}
      titleLines={3}
      meta={article.date}
      action={
        article.link ? (
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className={actionClass}
          >
            Read <ArrowRight size={10} />
          </a>
        ) : (
          <button
            onClick={() =>
              onDiscuss(
                `What does this news mean for my ${ticker} holding? "${article.title}"`,
              )
            }
            className={actionClass}
          >
            Discuss <ArrowRight size={10} />
          </button>
        )
      }
    />
  );
}

export function TechnicalAlertCard({
  card,
  width,
}: {
  card: TechnicalCard;
  width: string;
}) {
  const d = card.data;
  const meta =
    d?.support != null && d?.resistance != null
      ? `Support ₹${fmt(d.support, 0)} · Resistance ₹${fmt(d.resistance, 0)}`
      : [
          d?.rsi14 != null && `RSI ${fmt(d.rsi14, 0)}`,
          d?.returns?.yearly != null &&
            `1Y ${d.returns.yearly >= 0 ? "+" : ""}${fmt(d.returns.yearly)}%`,
        ]
          .filter(Boolean)
          .join(" · ");
  return (
    <AlertCard
      width={width}
      ticker={tickerOf(card.holding)}
      badge={card.badge}
      title={card.holding.name || tickerOf(card.holding)}
      desc={card.line}
      meta={meta}
    />
  );
}

export function FundamentalAlertCard({
  card,
  width,
}: {
  card: FundamentalCard;
  width: string;
}) {
  const d = card.data;
  const meta = [
    d?.pe != null && `P/E ${fmt(d.pe)}x`,
    d?.pb != null && `P/B ${fmt(d.pb)}x`,
    d?.roe != null && `ROE ${fmt(d.roe)}%`,
    d?.de != null && `Debt/Equity ${fmt(d.de)}`,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <AlertCard
      width={width}
      ticker={tickerOf(card.holding)}
      badge={card.badge}
      title={card.holding.name || tickerOf(card.holding)}
      desc={card.line}
      meta={meta}
    />
  );
}

/* ------------------------------------ Loading / empty ------------------------------------ */

const shimmer =
  "block animate-pulse rounded bg-slate-100 dark:bg-slate-800 motion-reduce:animate-none";

export function AlertCardSkeleton({ width }: { width: string }) {
  return (
    <div
      className={`${width} glass-card rounded-card flex snap-start flex-col gap-3 p-5`}
      aria-hidden="true"
    >
      <div className="flex justify-between">
        <span className={`${shimmer} h-3 w-16`} />
        <span className={`${shimmer} h-4 w-14 rounded-full`} />
      </div>
      <span className={`${shimmer} h-4 w-3/4`} />
      <span className={`${shimmer} h-3 w-full`} />
      <span className={`${shimmer} h-3 w-2/3`} />
      <span className={`${shimmer} mt-3 h-3 w-1/2`} />
    </div>
  );
}

/** Quiet message card for a row with nothing to show (or a failed load). */
export function RowMessage({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="glass-card rounded-card flex items-center justify-between gap-3 px-5 py-4">
      <p className="text-[11px] leading-relaxed text-slate-400">{children}</p>
      {action}
    </div>
  );
}
