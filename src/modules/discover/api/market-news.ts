import { getJson } from "./client";

/**
 * `GET /api/news/market` — the account-agnostic Nifty 50 headline feed behind
 * Discover's News Impact row and Home's news carousel. Ported from
 * finsharpe-mobile `lib/features/news/data/market_news_api.dart`, field for
 * field, so a headline cannot read one way there and another here.
 *
 * The payload carries a headline, its tags, a time and a link — **no summary,
 * no body, no thumbnail**, and no paging, categories or per-id endpoint.
 * Nothing on these screens may invent one.
 */

/** Visual tone of the sentiment badge; mirrors the backend's `BadgeTone`. */
export type NewsTone = "positive" | "neutral" | "negative";

export interface MarketNewsItem {
  id: string;
  /** Headline with its trailing " - Publisher" suffix already cut server-side. */
  title: string;
  tone: NewsTone;
  /** Badge copy from the backend ("Positive"/"Neutral"/"Negative"); may be empty. */
  sentimentLabel: string;
  /** Publisher parsed off the headline; null when the tail didn't look like one. */
  source: string | null;
  /** Registered name of the tagged company, when the feed carries one. */
  company: string | null;
  symbol: string | null;
  publishedAt: Date | null;
  link: string | null;
}

interface WireNewsItem {
  id?: unknown;
  title?: unknown;
  sentiment?: { tone?: unknown; label?: unknown } | null;
  source?: unknown;
  company?: unknown;
  symbol?: unknown;
  date?: unknown;
  link?: unknown;
}

const str = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

const toneOf = (raw: unknown): NewsTone =>
  raw === "positive" ? "positive" : raw === "negative" ? "negative" : "neutral";

/** A malformed timestamp costs the card its relative-time line, not the whole feed. */
const parseDate = (raw: unknown): Date | null => {
  const value = str(raw);
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toItem = (wire: WireNewsItem): MarketNewsItem => ({
  id: wire.id == null ? "" : String(wire.id),
  title: str(wire.title) ?? "",
  tone: toneOf(wire.sentiment?.tone),
  sentimentLabel: str(wire.sentiment?.label) ?? "",
  source: str(wire.source),
  company: str(wire.company),
  symbol: str(wire.symbol),
  publishedAt: parseDate(wire.date),
  link: str(wire.link),
});

export async function fetchMarketNews(
  signal?: AbortSignal,
): Promise<MarketNewsItem[]> {
  const body = await getJson<{ items?: WireNewsItem[] }>("news/market", {
    signal,
  });
  return (Array.isArray(body.items) ? body.items : []).map(toItem);
}

/** The chat hand-off a tapped headline seeds, worded as in finsharpe-mobile. */
export const newsAskPrompt = (title: string) =>
  `Tell me more about this market news: ${title}`;

/** Whether a link is something a browser can actually open. */
export const canOpenLink = (link: string | null): link is string => {
  if (!link) return false;
  try {
    return !!new URL(link).protocol;
  } catch {
    return false;
  }
};

/**
 * One page of Discover's Market news list (`GET /api/news/market/list`,
 * finsharpe-agents#242): the same tape as Home's eight, at most 2 per company
 * per page. A live tape shifts between requests, so a row can come back on
 * two pages, and a page can come back empty while `nextPage` is still set.
 */
export interface MarketNewsPage {
  items: MarketNewsItem[];
  /** Null on the last page. */
  nextPage: number | null;
}

export async function fetchMarketNewsPage(
  page: number,
  signal?: AbortSignal,
): Promise<MarketNewsPage> {
  const body = await getJson<{ items?: WireNewsItem[]; nextPage?: unknown }>(
    `news/market/list?page=${page}`,
    { signal },
  );
  return {
    items: (Array.isArray(body.items) ? body.items : []).map(toItem),
    nextPage: typeof body.nextPage === "number" ? body.nextPage : null,
  };
}
