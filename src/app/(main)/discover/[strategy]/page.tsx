"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

/**
 * Deep link to one strategy (shared links, older bookmarks). The strategy
 * detail lives in Discover's Explore Investment Ideas — a popup over the list
 * on desktop, full screen on mobile — so hand the visitor over to it.
 *
 * Replaced on the client: a server `redirect()` here streams inside the main
 * layout's Suspense boundary and trips React during the hand-off.
 */
export default function StrategyDeepLinkPage() {
  const { strategy } = useParams<{ strategy: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(
      `/discover?feature=ideas&strategy=${encodeURIComponent(safeDecode(strategy))}`,
    );
  }, [router, strategy]);

  return null;
}
