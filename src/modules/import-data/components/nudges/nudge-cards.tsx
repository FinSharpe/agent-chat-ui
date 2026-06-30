"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type {
  BadgeTone,
  FundamentalCard,
  NewsArticle,
  NudgeBadge,
  TechnicalCard,
  FinSharpeScoreCard,
} from "@/api/generated/nudge-apis/models";
import { cn } from "@/lib/utils";
import { Clock, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Sentiment is the one place colour carries real meaning, so it maps to the
 * semantic success/warning/error tokens (light + dark parity for free) rather
 * than a flooded card tint.
 */
const TONE_CLASS: Record<BadgeTone, string> = {
  positive: "bg-success-bg text-success-fg",
  neutral: "bg-warning-bg text-warning-fg",
  negative: "bg-error-bg text-error-fg",
};

/**
 * Compact list: shows roughly three holdings, then scrolls. Hairline dividers
 * group the rows instead of per-card colour, keeping the first view calm.
 */
const SCROLL_LIST =
  "divide-border-subtle border-border-subtle max-h-[var(--nudge-list-h)] divide-y overflow-y-auto border-t [scrollbar-width:thin]";

export function ToneBadge({ badge }: { badge?: NudgeBadge | null }) {
  if (!badge) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        TONE_CLASS[badge.tone as BadgeTone],
      )}
    >
      {badge.label}
    </span>
  );
}

/** A single labelled figure: tiny uppercase label over a tabular value. No
 * box, just aligned type — lets a row of metrics breathe and read as insight. */
function Metric({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-text-tertiary text-[10px] font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          "text-text-primary text-sm font-medium tabular-nums",
          valueClass,
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/** Row shell shared by every nudge type: consistent padding + hover. */
function NudgeRow({ children }: { children: ReactNode }) {
  return <div className="px-4 py-3.5">{children}</div>;
}

function RowHeader({
  title,
  badge,
  trailing,
}: {
  title: string;
  badge?: NudgeBadge | null;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-text-primary truncate text-sm font-medium">
        {title}
      </span>
      <ToneBadge badge={badge} />
      {trailing && <div className="ml-auto">{trailing}</div>}
    </div>
  );
}

export function NudgeSkeleton() {
  return (
    <div className="border-border-subtle divide-border-subtle divide-y border-t">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="space-y-2 px-4 py-3.5"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function NudgeEmpty({ message }: { message: string }) {
  return (
    <p className="text-text-tertiary border-border-subtle border-t px-4 py-4 text-sm">
      {message}
    </p>
  );
}

function NotCovered({ name }: { name: string }) {
  return (
    <NudgeRow>
      <p className="text-text-tertiary text-sm font-medium">{name}</p>
      <p className="text-text-muted text-xs">Not covered yet</p>
    </NudgeRow>
  );
}

function NudgeLine({ line }: { line?: string | null }) {
  if (!line) return null;
  return (
    <p className="text-text-secondary mt-1.5 text-sm leading-snug">{line}</p>
  );
}

function MetricRow({ children }: { children: ReactNode }) {
  return <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">{children}</dl>;
}

function cardTitle(card: {
  holding: { name?: string | null; symbol?: string | null; isin: string };
}) {
  return card.holding.symbol || card.holding.name || card.holding.isin;
}

const LIST_HEIGHT = {
  news: "230px",
  technical: "380px",
  fundamental: "360px",
  finsharpe: "360px",
} as const;

/* ----------------------------- News ----------------------------- */

export function NewsList({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0)
    return <NudgeEmpty message="No recent news for your holdings." />;
  return (
    <div
      className={SCROLL_LIST}
      style={{ ["--nudge-list-h" as string]: LIST_HEIGHT.news }}
    >
      {articles.map((a, i) => (
        <a
          key={`${a.isin}-${i}`}
          href={a.link ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:bg-muted/40 block px-4 py-3.5 transition-colors"
        >
          <RowHeader
            title={a.symbol || a.isin}
            badge={a.sentiment}
            trailing={
              a.date ? (
                <span className="text-text-tertiary inline-flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {a.date}
                </span>
              ) : null
            }
          />
          <p className="text-text-secondary mt-1.5 flex items-start gap-1 text-sm leading-snug">
            <span>{a.title}</span>
            {a.link && (
              <ExternalLink className="text-text-muted mt-0.5 h-3 w-3 flex-shrink-0" />
            )}
          </p>
        </a>
      ))}
    </div>
  );
}

/* --------------------------- Technical -------------------------- */

export function TechnicalCards({ cards }: { cards: TechnicalCard[] }) {
  if (cards.length === 0)
    return <NudgeEmpty message="No technical signals available." />;
  return (
    <div
      className={SCROLL_LIST}
      style={{ ["--nudge-list-h" as string]: LIST_HEIGHT.technical }}
    >
      {cards.map((card) =>
        card.coverage === "not_covered" ? (
          <NotCovered
            key={card.holding.isin}
            name={cardTitle(card)}
          />
        ) : (
          <NudgeRow key={card.holding.isin}>
            <RowHeader
              title={cardTitle(card)}
              badge={card.badge}
            />
            <NudgeLine line={card.line} />
            {card.data && (
              <>
                <MetricRow>
                  {card.data.rsi14 != null && (
                    <Metric
                      label="RSI"
                      value={card.data.rsi14.toFixed(0)}
                    />
                  )}
                  {card.data.dScore != null && (
                    <Metric
                      label="D-Score"
                      value={card.data.dScore.toFixed(0)}
                    />
                  )}
                  {card.data.returns?.yearly != null && (
                    <Metric
                      label="1Y"
                      value={`${card.data.returns.yearly.toFixed(1)}%`}
                      valueClass={
                        card.data.returns.yearly >= 0
                          ? "text-success-fg"
                          : "text-error-fg"
                      }
                    />
                  )}
                  {card.data.support != null &&
                    card.data.resistance != null && (
                      <Metric
                        label="Support / Resistance"
                        value={`${card.data.support.toFixed(0)} / ${card.data.resistance.toFixed(0)}`}
                      />
                    )}
                </MetricRow>
                {(card.data.candlePatterns?.length ||
                  card.data.pfPatterns?.length ||
                  card.data.gapUpDown) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {card.data.gapUpDown && (
                      <span className="border-border text-text-secondary rounded-md border px-2 py-0.5 text-xs">
                        {card.data.gapUpDown}
                      </span>
                    )}
                    {[
                      ...(card.data.candlePatterns ?? []),
                      ...(card.data.pfPatterns ?? []),
                    ]
                      .slice(0, 3)
                      .map((p) => (
                        <span
                          key={p}
                          className="border-border text-text-secondary rounded-md border px-2 py-0.5 text-xs"
                        >
                          {p}
                        </span>
                      ))}
                  </div>
                )}
              </>
            )}
          </NudgeRow>
        ),
      )}
    </div>
  );
}

/* -------------------------- Fundamental ------------------------- */

export function FundamentalCards({ cards }: { cards: FundamentalCard[] }) {
  if (cards.length === 0)
    return <NudgeEmpty message="No fundamental data available." />;
  return (
    <div
      className={SCROLL_LIST}
      style={{ ["--nudge-list-h" as string]: LIST_HEIGHT.fundamental }}
    >
      {cards.map((card) =>
        card.coverage === "not_covered" ? (
          <NotCovered
            key={card.holding.isin}
            name={cardTitle(card)}
          />
        ) : (
          <NudgeRow key={card.holding.isin}>
            <RowHeader
              title={cardTitle(card)}
              badge={card.badge}
            />
            <NudgeLine line={card.line} />
            {card.data && (
              <MetricRow>
                {card.data.pe != null && (
                  <Metric
                    label="P/E"
                    value={`${card.data.pe.toFixed(1)}x`}
                  />
                )}
                {card.data.sectorPe != null && (
                  <Metric
                    label="Sector P/E"
                    value={`${card.data.sectorPe.toFixed(1)}x`}
                  />
                )}
                {card.data.pb != null && (
                  <Metric
                    label="P/B"
                    value={`${card.data.pb.toFixed(1)}x`}
                  />
                )}
                {card.data.roe != null && (
                  <Metric
                    label="ROE"
                    value={`${card.data.roe.toFixed(1)}%`}
                  />
                )}
              </MetricRow>
            )}
          </NudgeRow>
        ),
      )}
    </div>
  );
}

/* ------------------------ FinSharpe Score ----------------------- */

export function FinSharpeCards({ cards }: { cards: FinSharpeScoreCard[] }) {
  if (cards.length === 0)
    return <NudgeEmpty message="No FinSharpe scores available." />;
  return (
    <div
      className={SCROLL_LIST}
      style={{ ["--nudge-list-h" as string]: LIST_HEIGHT.finsharpe }}
    >
      {cards.map((card) =>
        card.coverage === "not_covered" ? (
          <NotCovered
            key={card.holding.isin}
            name={cardTitle(card)}
          />
        ) : (
          <NudgeRow key={card.holding.isin}>
            <RowHeader
              title={cardTitle(card)}
              badge={card.badge}
            />
            <NudgeLine line={card.line} />
            {card.scores?.kind === "equity" && (
              <MetricRow>
                {card.scores.overall != null && (
                  <Metric
                    label="Overall"
                    value={card.scores.overall.toFixed(0)}
                  />
                )}
                {card.scores.overallIndustry != null && (
                  <Metric
                    label="Industry"
                    value={card.scores.overallIndustry.toFixed(0)}
                  />
                )}
                {card.scores.growth != null && (
                  <Metric
                    label="Growth"
                    value={card.scores.growth.toFixed(0)}
                  />
                )}
                {card.scores.value != null && (
                  <Metric
                    label="Value"
                    value={card.scores.value.toFixed(0)}
                  />
                )}
              </MetricRow>
            )}
            {card.scores?.kind === "mf" && (
              <MetricRow>
                {card.scores.overallRank != null && (
                  <Metric
                    label="Rank"
                    value={`#${card.scores.overallRank.toFixed(0)}`}
                  />
                )}
                {card.scores.performance != null && (
                  <Metric
                    label="Performance"
                    value={card.scores.performance.toFixed(0)}
                  />
                )}
                {card.scores.riskAdjReturn != null && (
                  <Metric
                    label="Risk-Adjusted"
                    value={card.scores.riskAdjReturn.toFixed(0)}
                  />
                )}
              </MetricRow>
            )}
          </NudgeRow>
        ),
      )}
    </div>
  );
}
