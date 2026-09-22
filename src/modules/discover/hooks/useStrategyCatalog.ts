"use client";

import { useMemo } from "react";
import { useGetAllStrategiesApiStrategiesGet } from "@/api/generated/strategy-apis/strategy-apis/strategy-apis";
import { StrategyMasterDetail } from "@/api/generated/strategy-apis/models";
import { comingSoonIdeaCategories } from "../constants/discover-data";
import { IdeaCategory, IdeaStrategy } from "../types/discover.types";
import { formatPct } from "../utils/format";

/**
 * The list endpoint also returns cached trailing stats per strategy; the
 * generated client predates that field, so it is read as optional here.
 */
type StrategyListItem = StrategyMasterDetail & {
  stats?: { ret_1y_pct?: number | null } | null;
};

const toIdea = (s: StrategyListItem): IdeaStrategy => {
  const ret = s.stats?.ret_1y_pct;
  return {
    id: s.strategy,
    title: s.display_name || s.strategy,
    summary: s.category || undefined,
    description: s.description || undefined,
    tags: s.category ? [s.category] : [],
    return1Y: ret === null || ret === undefined ? undefined : formatPct(ret),
    risk: s.risk_level || undefined,
    stocks: s.stock_count,
  };
};

/**
 * Explore Investment Ideas' catalog: the advisor strategies from the
 * strategies API, then the categories that have no backend — drawn as
 * disabled cards with no count and nothing to open (T-04).
 */
export function useStrategyCatalog() {
  const { data, isLoading, isError } = useGetAllStrategiesApiStrategiesGet({
    query: { staleTime: 5 * 60 * 1000 },
  });

  // The fetch helper does not throw on HTTP errors — treat a missing list on a
  // non-2xx status as a failure too.
  const advisorsFailed = isError || (!!data && data.status >= 400);

  const advisorStrategies = useMemo(() => {
    const list = (data?.data?.strategies ?? []) as StrategyListItem[];
    return Array.isArray(list) ? list.map(toIdea) : [];
  }, [data]);

  const categories: IdeaCategory[] = useMemo(
    () => [
      {
        id: "advisors",
        name: "Created by Advisors",
        strategies: advisorStrategies,
        isLoading,
        isError: advisorsFailed,
      },
      ...comingSoonIdeaCategories,
    ],
    [advisorStrategies, isLoading, advisorsFailed],
  );

  return {
    categories,
    advisorStrategies,
    /** True once the catalog is known — the point a stale deep link can be judged. */
    advisorsResolved: !isLoading && !advisorsFailed,
  };
}
