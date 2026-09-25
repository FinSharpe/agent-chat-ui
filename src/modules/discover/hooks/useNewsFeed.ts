"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  NewsFeedPager,
  type NewsFeedPage,
  type NewsFeedState,
} from "../utils/news-feed";

/**
 * The pager over a page 1 that comes from a query — so a list whose first
 * page is already cached (Holdings news is the Import row's own) opens with
 * no request. A new page 1 starts the list over.
 */
export function useNewsFeed<C>(
  first: NewsFeedPage<C> | undefined,
  fetchPage: (cursor: C) => Promise<NewsFeedPage<C>>,
) {
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const base = useMemo(() => {
    if (!first) return null;
    const pager = new NewsFeedPager<C>((c) => fetchRef.current(c));
    return { pager, state: pager.start(first) };
  }, [first]);

  const [later, setLater] = useState<{
    pager: NewsFeedPager<C>;
    state: NewsFeedState;
  } | null>(null);
  const state =
    base && later?.pager === base.pager ? later.state : (base?.state ?? null);

  const loadMore = useCallback(async () => {
    if (!base || !state || !base.pager.canLoad(state)) return;
    const { pager } = base;
    setLater({ pager, state: { ...state, foot: "loading" } });
    const next = await pager.more(state);
    setLater((prev) => (prev?.pager === pager ? { pager, state: next } : prev));
  }, [base, state]);

  return { feed: state, loadMore };
}
