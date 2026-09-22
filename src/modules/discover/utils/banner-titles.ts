import type { MarketNewsItem } from "../api/market-news";
import type { IpoIssue } from "../api/ipo";
import { isSameDay } from "./relative-time";
import { windowStateAt } from "./ipo-window";

/**
 * The sentence each live Discover feature's banner opens with, computed from
 * the served data. Counts, never names: the banner introduces the page and the
 * rows below carry every item — and a count the payload cannot support falls
 * back to a standing description rather than becoming a number this app
 * invented.
 */

/** Home's lead-in to the same feed, and the news banner's fallback title. */
export const NEWS_BANNER_FALLBACK =
  "The biggest market headlines, decoded and curated daily";

/**
 * How many of the headlines on the page were published today — the one count
 * the payload lets the page make honestly, since the feed is "the latest" and
 * not "today's".
 */
export function newsBannerTitle(
  items: MarketNewsItem[] | undefined,
  now: Date = new Date(),
): string {
  if (!items) return NEWS_BANNER_FALLBACK;
  const today = items.filter(
    (item) => item.publishedAt && isSameDay(item.publishedAt, now),
  ).length;
  if (today === 0) return NEWS_BANNER_FALLBACK;
  return today === 1
    ? "1 Nifty 50 headline today"
    : `${today} Nifty 50 headlines today`;
}

/** "3 issues open for bidding, 2 more opening soon". */
export function ipoBannerTitle(issues: IpoIssue[], now: Date): string {
  let open = 0;
  let upcoming = 0;
  for (const issue of issues) {
    const state = windowStateAt(issue.biddingWindow, now);
    if (state === "open") open++;
    else if (state === "upcoming") upcoming++;
  }
  const issuesWord = (n: number) => (n === 1 ? "1 issue" : `${n} issues`);
  if (open > 0 && upcoming > 0)
    return `${issuesWord(open)} open for bidding, ${upcoming} more opening soon`;
  if (open > 0) return `${issuesWord(open)} open for bidding`;
  if (upcoming > 0) return `${issuesWord(upcoming)} opening soon`;
  return "Open and upcoming issues on BSE and NSE";
}
