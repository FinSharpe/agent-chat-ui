"use client";

import { Badge } from "@/components/ui/badge";
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
import { ExternalLink } from "lucide-react";

const TONE_CLASS: Record<BadgeTone, string> = {
  positive: "bg-green-50 text-green-700 border-green-200",
  neutral: "bg-yellow-50 text-yellow-700 border-yellow-200",
  negative: "bg-red-50 text-red-700 border-red-200",
};

export function ToneBadge({ badge }: { badge?: NudgeBadge | null }) {
  if (!badge) return null;
  return (
    <Badge
      variant="outline"
      className={cn("text-xs", TONE_CLASS[badge.tone as BadgeTone])}
    >
      {badge.label}
    </Badge>
  );
}

export function NudgeSkeleton() {
  return (
    <div className="space-y-3 px-4 pt-3 pb-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="space-y-2 rounded-lg border border-gray-100 p-3"
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
  return <p className="px-4 pt-3 pb-4 text-xs text-gray-500">{message}</p>;
}

function NotCovered({ name }: { name: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 p-3">
      <p className="text-xs font-medium text-gray-700">{name}</p>
      <p className="text-xs text-gray-400">Not covered yet</p>
    </div>
  );
}

function NudgeLine({ line }: { line?: string | null }) {
  if (!line) return null;
  return <p className="mb-1 text-xs text-gray-700">{line}</p>;
}

function cardTitle(card: {
  holding: { name?: string | null; symbol?: string | null; isin: string };
}) {
  return card.holding.symbol || card.holding.name || card.holding.isin;
}

/* ----------------------------- News ----------------------------- */

export function NewsList({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0)
    return <NudgeEmpty message="No recent news for your holdings." />;
  return (
    <div className="space-y-3 px-4 pb-4">
      {articles.map((a, i) => (
        <a
          key={`${a.isin}-${i}`}
          href={a.link ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg bg-purple-50 p-3 transition-colors hover:bg-purple-100"
        >
          <div className="mb-1 flex items-center gap-2">
            <Badge className="border-purple-200 bg-purple-100 text-xs text-purple-800">
              {a.symbol || a.isin}
            </Badge>
            <ToneBadge badge={a.sentiment} />
            {a.date && (
              <span className="ml-auto text-xs text-gray-500">{a.date}</span>
            )}
          </div>
          <p className="flex items-start gap-1 text-xs text-gray-700">
            <span>{a.title}</span>
            {a.link && (
              <ExternalLink className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-400" />
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
    <div className="space-y-3 px-4 pb-4">
      {cards.map((card) =>
        card.coverage === "not_covered" ? (
          <NotCovered
            key={card.holding.isin}
            name={cardTitle(card)}
          />
        ) : (
          <div
            key={card.holding.isin}
            className="rounded-lg bg-blue-50 p-3"
          >
            <div className="mb-1 flex items-start justify-between">
              <Badge className="border-blue-200 bg-blue-100 text-xs text-blue-800">
                {cardTitle(card)}
              </Badge>
              <ToneBadge badge={card.badge} />
            </div>
            <NudgeLine line={card.line} />
            {card.data && (
              <>
                <div className="flex flex-wrap gap-x-3 text-xs font-medium text-blue-600">
                  {card.data.rsi14 != null && (
                    <span>RSI {card.data.rsi14.toFixed(0)}</span>
                  )}
                  {card.data.dScore != null && (
                    <span>D-Score {card.data.dScore.toFixed(0)}</span>
                  )}
                  {card.data.returns?.yearly != null && (
                    <span>1Y {card.data.returns.yearly.toFixed(1)}%</span>
                  )}
                  {card.data.support != null &&
                    card.data.resistance != null && (
                      <span>
                        S {card.data.support.toFixed(0)} · R{" "}
                        {card.data.resistance.toFixed(0)}
                      </span>
                    )}
                </div>
                {(card.data.candlePatterns?.length ||
                  card.data.pfPatterns?.length ||
                  card.data.gapUpDown) && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {card.data.gapUpDown && (
                      <Badge
                        variant="outline"
                        className="text-xs text-gray-600"
                      >
                        {card.data.gapUpDown}
                      </Badge>
                    )}
                    {[
                      ...(card.data.candlePatterns ?? []),
                      ...(card.data.pfPatterns ?? []),
                    ]
                      .slice(0, 3)
                      .map((p) => (
                        <Badge
                          key={p}
                          variant="outline"
                          className="text-xs text-blue-700"
                        >
                          {p}
                        </Badge>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
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
    <div className="space-y-3 px-4 pb-4">
      {cards.map((card) =>
        card.coverage === "not_covered" ? (
          <NotCovered
            key={card.holding.isin}
            name={cardTitle(card)}
          />
        ) : (
          <div
            key={card.holding.isin}
            className="rounded-lg bg-green-50 p-3"
          >
            <div className="mb-1 flex items-start justify-between">
              <Badge className="border-green-200 bg-green-100 text-xs text-green-800">
                {cardTitle(card)}
              </Badge>
              <ToneBadge badge={card.badge} />
            </div>
            <NudgeLine line={card.line} />
            {card.data && (
              <div className="flex flex-wrap gap-x-4 text-xs text-gray-600">
                {card.data.pe != null && (
                  <span>P/E {card.data.pe.toFixed(1)}x</span>
                )}
                {card.data.sectorPe != null && (
                  <span>Sector {card.data.sectorPe.toFixed(1)}x</span>
                )}
                {card.data.pb != null && (
                  <span>P/B {card.data.pb.toFixed(1)}x</span>
                )}
                {card.data.roe != null && (
                  <span>ROE {card.data.roe.toFixed(1)}%</span>
                )}
              </div>
            )}
          </div>
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
    <div className="space-y-3 px-4 pb-4">
      {cards.map((card) =>
        card.coverage === "not_covered" ? (
          <NotCovered
            key={card.holding.isin}
            name={cardTitle(card)}
          />
        ) : (
          <div
            key={card.holding.isin}
            className="rounded-lg border border-purple-100 bg-gradient-to-br from-purple-50 to-blue-50 p-3"
          >
            <div className="mb-1 flex items-start justify-between">
              <Badge className="border-purple-200 bg-purple-100 text-xs text-purple-800">
                {cardTitle(card)}
              </Badge>
              <ToneBadge badge={card.badge} />
            </div>
            <NudgeLine line={card.line} />
            {card.scores?.kind === "equity" && (
              <div className="flex flex-wrap gap-x-4 text-xs text-gray-600">
                {card.scores.overall != null && (
                  <span>Overall {card.scores.overall.toFixed(0)}</span>
                )}
                {card.scores.overallIndustry != null && (
                  <span>Industry {card.scores.overallIndustry.toFixed(0)}</span>
                )}
                {card.scores.growth != null && (
                  <span>Growth {card.scores.growth.toFixed(0)}</span>
                )}
                {card.scores.value != null && (
                  <span>Value {card.scores.value.toFixed(0)}</span>
                )}
              </div>
            )}
            {card.scores?.kind === "mf" && (
              <div className="flex flex-wrap gap-x-4 text-xs text-gray-600">
                {card.scores.overallRank != null && (
                  <span>Rank #{card.scores.overallRank.toFixed(0)}</span>
                )}
                {card.scores.performance != null && (
                  <span>Performance {card.scores.performance.toFixed(0)}</span>
                )}
                {card.scores.riskAdjReturn != null && (
                  <span>Risk-Adj {card.scores.riskAdjReturn.toFixed(0)}</span>
                )}
              </div>
            )}
          </div>
        ),
      )}
    </div>
  );
}
