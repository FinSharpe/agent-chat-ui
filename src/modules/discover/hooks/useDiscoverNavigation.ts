"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { useUiStore } from "@/store/useUiStore";
import { DISCOVER_ROUTE_FEATURES } from "../constants/discover-nav";
import {
  DISCOVER_FEATURES,
  DiscoverFeature,
  LocalDiscoverFeature,
} from "../types/discover.types";

const LOCAL_FEATURES = ["news", "ideas", "trading", "global"] as const;

const discoverQuery = {
  feature: parseAsStringLiteral(LOCAL_FEATURES),
  strategy: parseAsString,
};

const isDiscoverFeature = (v: string): v is DiscoverFeature =>
  (DISCOVER_FEATURES as readonly string[]).includes(v);

/**
 * Which Discover feature (and, in Explore Investment Ideas, which strategy)
 * is open. Kept in the query string — `?feature=ideas&strategy=<id>` — so
 * features deep-link and the browser/Android back button closes them the way
 * the reference's back buttons do.
 */
export function useDiscoverNavigation() {
  const router = useRouter();
  const [{ feature, strategy }, setQuery] = useQueryStates(discoverQuery, {
    scroll: false,
  });

  // Whether this screen pushed the current entry. Closing then pops it, so
  // back and the header's back button never leave duplicate history.
  const pushedFeature = useRef(false);
  const pushedStrategy = useRef(false);

  const openFeature = useCallback(
    (id: DiscoverFeature, { replace = false } = {}) => {
      const route = DISCOVER_ROUTE_FEATURES[id];
      if (route) {
        if (replace) router.replace(route);
        else router.push(route);
        return;
      }
      pushedFeature.current = !replace;
      setQuery(
        { feature: id as LocalDiscoverFeature, strategy: null },
        { history: replace ? "replace" : "push" },
      );
    },
    [router, setQuery],
  );

  const closeFeature = useCallback(() => {
    if (pushedFeature.current && !strategy) {
      pushedFeature.current = false;
      router.back();
      return;
    }
    pushedFeature.current = false;
    pushedStrategy.current = false;
    setQuery({ feature: null, strategy: null }, { history: "replace" });
  }, [router, setQuery, strategy]);

  const openStrategy = useCallback(
    (id: string) => {
      pushedStrategy.current = true;
      setQuery({ feature: "ideas", strategy: id }, { history: "push" });
    },
    [setQuery],
  );

  const closeStrategy = useCallback(() => {
    if (pushedStrategy.current) {
      pushedStrategy.current = false;
      router.back();
      return;
    }
    setQuery({ strategy: null }, { history: "replace" });
  }, [router, setQuery]);

  // Honour a deep-link set by another screen (e.g. Home's "Explore Investment
  // Strategies" card), then clear it so returning here later starts fresh.
  const pending = useUiStore((s) => s.pendingDiscoverFeature);
  const setPending = useUiStore((s) => s.setPendingDiscoverFeature);
  useEffect(() => {
    if (!pending) return;
    setPending(null);
    if (isDiscoverFeature(pending)) openFeature(pending, { replace: true });
  }, [pending, setPending, openFeature]);

  return {
    // A bare `?strategy=` (an old share link) still lands in the catalog.
    feature: (feature ??
      (strategy ? "ideas" : null)) as LocalDiscoverFeature | null,
    strategyId: strategy,
    openFeature,
    closeFeature,
    openStrategy,
    closeStrategy,
  };
}
