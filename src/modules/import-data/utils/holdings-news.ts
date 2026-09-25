import type { NewsArticle } from "@/api/generated/nudge-apis/models";
import type { MarketNewsItem } from "@/modules/discover/api/market-news";

/**
 * The holdings news feed read as the card Home and the news page draw, so
 * the Deep Dive News row mounts the same `NewsCard` — finsharpe-mobile's
 * `NewsArticle.asMarketNewsItem` (`nudges_api.dart`, #145 §4); change the two
 * together. The wire stamp becomes a real date so the card can say "2h ago",
 * the publisher moves off the headline into the footer, and `company` stays
 * null because this feed serves none.
 */

/** A tail longer than this is part of the headline, not a publisher. */
const MAX_SOURCE_LENGTH = 40;
const SOURCE_SPLIT = /\s+-\s+/g;

/**
 * `"Headline - Publisher"` → `[headline, publisher]`, on the *last*
 * separator only: headlines legitimately contain " - " ("Vi ARPU grows 8.3% -
 * ahead of Airtel - telecomtalk.info"). A tail that is empty, too long or
 * ends in punctuation stays on the headline.
 */
export function splitSource(title: string): [string, string | null] {
  const matches = [...title.matchAll(SOURCE_SPLIT)];
  const last = matches.at(-1);
  if (!last || last.index == null) return [title.trim(), null];
  const head = title.slice(0, last.index).trim();
  const tail = title.slice(last.index + last[0].length).trim();
  if (
    head === "" ||
    tail === "" ||
    tail.length > MAX_SOURCE_LENGTH ||
    ".,;:!?".includes(tail[tail.length - 1])
  ) {
    return [title.trim(), null];
  }
  return [head, tail];
}

/** A malformed stamp costs the card its time, not the whole row. */
const parseDate = (raw: string | null | undefined): Date | null => {
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export function holdingsNewsItem(article: NewsArticle): MarketNewsItem {
  const [headline, publisher] = splitSource(article.title);
  const tone = article.sentiment?.tone;
  return {
    // The feed carries no id; the link is what tells one story from the next.
    id: article.link ?? headline,
    title: headline,
    tone: tone === "positive" || tone === "negative" ? tone : "neutral",
    sentimentLabel: article.sentiment?.label ?? "",
    source: publisher,
    company: null,
    symbol: article.symbol ?? null,
    publishedAt: parseDate(article.date),
    link: article.link ?? null,
  };
}

/** A holding the news feed checked and found nothing on, as served. */
export interface QuietHoldingRef {
  isin: string;
  name?: string | null;
  symbol?: string | null;
}

/** "Tata Consultancy Services Limited" → "Tata Consultancy Services". */
const shortCompanyName = (name: string) => {
  const trimmed = name.trim();
  for (const suffix of [" Limited", " Ltd.", " Ltd"]) {
    if (trimmed.toLowerCase().endsWith(suffix.toLowerCase())) {
      return trimmed.slice(0, trimmed.length - suffix.length).trimEnd();
    }
  }
  return trimmed;
};

/**
 * How the end line names a quiet holding: by symbol, as every card's kicker
 * names its stock. The name the book sends is the depository's legal one —
 * capitals, an occasional raw `&amp;` — so it stands in, shortened, only when
 * the server resolved no symbol (mobile's `QuietHolding.label`).
 */
export function quietHoldingLabel(h: QuietHoldingRef): string {
  if (h.symbol) return h.symbol;
  const name = h.name?.trim();
  if (name) return shortCompanyName(name);
  return h.isin;
}

/** "Nothing on LT or ETERNAL in that time." — or null when the feed found
 *  something on every holding it read. */
export function quietHoldingsLine(names: string[]): string | null {
  if (names.length === 0) return null;
  const who =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
  return `Nothing on ${who} in that time.`;
}

/** The header's subtitle: how many of the book's largest stocks the feed read. */
export function holdingsNewsSubtitle(stocks: number): string {
  if (stocks === 0) return "Your largest stocks · last 7 days";
  if (stocks === 1) return "Your largest stock · last 7 days";
  return `Your ${stocks} largest stocks · last 7 days`;
}
