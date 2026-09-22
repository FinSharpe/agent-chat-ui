"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeReturnPath } from "@/lib/auth/return-path";

/**
 * Moves between the auth screens without dropping `?next=`, the page the
 * visitor was headed to before the middleware sent them here. `next` is
 * already vetted by `safeReturnPath`, so it is safe to push once signed in.
 */
export function useAuthNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeReturnPath(searchParams.get("next"));

  const hrefFor = useCallback(
    (path: string, params: Record<string, string> = {}) => {
      const query = new URLSearchParams(params);
      // "/" is where a signed-in visitor lands anyway; keep the URL clean.
      if (next !== "/") query.set("next", next);
      const qs = query.toString();
      return qs ? `${path}?${qs}` : path;
    },
    [next],
  );

  const go = useCallback(
    (path: string, params?: Record<string, string>) =>
      router.push(hrefFor(path, params)),
    [router, hrefFor],
  );

  /** Into the app once signed in. */
  const finish = useCallback(() => router.push(next), [router, next]);

  return { next, hrefFor, go, finish };
}
