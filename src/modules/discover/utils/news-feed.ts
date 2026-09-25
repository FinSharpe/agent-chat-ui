import type { MarketNewsItem } from "../api/market-news";

/**
 * A news feed read a page at a time, for the two lists that page: Holdings
 * news behind the Import News row, and Discover's Market news. Each has its
 * own endpoint and cursor `C`; the rules for drawing what comes back are
 * shared — finsharpe-mobile's `news_feed.dart` (#174); change the two
 * together.
 */

/** A page as the pager sees it: the cards, where the next page is (null on
 *  the last), and the names the feed checked and found nothing on. */
export interface NewsFeedPage<C> {
  items: MarketNewsItem[];
  next: C | null;
  quiet?: string[] | null;
}

/**
 * What the list shows under its last card: nothing while there is `more`
 * (the next page is asked for as the reader nears the end), a skeleton while
 * `loading`, Try again when `failed` (the cards stay), a Show more button when
 * pages kept coming back empty (`stalled`), or the end line.
 */
export type NewsFeedFoot = "more" | "loading" | "failed" | "stalled" | "end";

export interface NewsFeedState {
  items: MarketNewsItem[];
  foot: NewsFeedFoot;
  /** Named on the end line: "Nothing on … in that time." */
  quiet: string[];
  /** How many of `items` page 1 drew: a count over the page holds still as
   *  the list grows. */
  firstPageCount: number;
}

/** Empty pages asked for in a row before the list stops at Show more. */
export const MAX_EMPTY_RUN = 3;

/**
 * One list's paging: page 1 in, then [more] for each page after it. Cards
 * dedup on id — the live tape shifts while the reader scrolls, so a row can
 * come back on a later page.
 */
export class NewsFeedPager<C> {
  private next: C | null = null;
  private readonly seen = new Set<string>();
  private busy = false;

  constructor(
    private readonly fetchPage: (cursor: C) => Promise<NewsFeedPage<C>>,
  ) {}

  private fresh(items: MarketNewsItem[]) {
    return items.filter((item) => {
      if (this.seen.has(item.id)) return false;
      this.seen.add(item.id);
      return true;
    });
  }

  start(first: NewsFeedPage<C>): NewsFeedState {
    this.seen.clear();
    this.next = first.next;
    const items = this.fresh(first.items);
    return {
      items,
      foot: first.next == null ? "end" : "more",
      quiet: first.quiet ?? [],
      firstPageCount: items.length,
    };
  }

  /** Whether a [more] call would ask for anything. */
  canLoad(state: NewsFeedState) {
    return (
      !this.busy &&
      this.next != null &&
      state.foot !== "loading" &&
      state.foot !== "end"
    );
  }

  /**
   * The state after the next page. A page with nothing new on it would look
   * like the end, so the one after is asked for at once — up to
   * [MAX_EMPTY_RUN] in a row, then Show more. A failed page keeps the cards.
   */
  async more(state: NewsFeedState): Promise<NewsFeedState> {
    if (!this.canLoad(state)) return state;
    this.busy = true;
    let items = state.items;
    let quiet = state.quiet;
    let foot: NewsFeedFoot;
    try {
      for (let empty = 0; ; ) {
        let page: NewsFeedPage<C>;
        try {
          page = await this.fetchPage(this.next as C);
        } catch {
          foot = "failed";
          break;
        }
        const fresh = this.fresh(page.items);
        items = [...items, ...fresh];
        quiet = page.quiet ?? quiet;
        this.next = page.next;
        if (page.next == null) foot = "end";
        else if (fresh.length > 0) foot = "more";
        else if (++empty >= MAX_EMPTY_RUN) foot = "stalled";
        else continue;
        break;
      }
    } finally {
      this.busy = false;
    }
    return { items, foot, quiet, firstPageCount: state.firstPageCount };
  }
}
