"use client";

/**
 * React Query bindings for the Balance and the History.
 *
 * When they refetch (plan Phase 7):
 * - whenever an account surface or the Credits page opens — every observer
 *   mounts with `refetchOnMount: "always"`, so opening the sidebar footer,
 *   the phone account sheet or the page reads afresh;
 * - whenever a `credits` carrier lands on a chat answer
 *   (`useRefreshCreditsOnCarrier`);
 * - after a Pipeline purchase is answered, whatever the answer
 *   (`refreshCredits`, called by the pipelines module).
 *
 * Keys carry the signed-in account's id, so one tab never shows another
 * account's Balance from cache.
 */

import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";

import type { UserCreditHistoryPage } from "@/api/generated/credits-apis/models";
import { isHydratedUser, useAuth } from "@/providers/AuthProvider";

import {
  fetchCreditBalance,
  fetchCreditHistoryPage,
} from "../api/credits-client";
import { creditsCarrierSignatures, noteNewCarriers } from "../utils/carrier";
import { creditRequestHref } from "../utils/request";

export const creditKeys = {
  all: ["credits"] as const,
  balance: (userId: string) => ["credits", userId, "balance"] as const,
  history: (userId: string) => ["credits", userId, "history"] as const,
};

export function creditBalanceQuery(userId: string) {
  return queryOptions({
    queryKey: creditKeys.balance(userId),
    queryFn: ({ signal }) => fetchCreditBalance(signal),
    refetchOnMount: "always",
  });
}

export function creditHistoryQuery(userId: string) {
  return infiniteQueryOptions({
    queryKey: creditKeys.history(userId),
    queryFn: ({ pageParam, signal }) =>
      fetchCreditHistoryPage(pageParam, signal),
    initialPageParam: null as string | null,
    // Newest first; the server's cursor walks backwards in time.
    getNextPageParam: (last: UserCreditHistoryPage) =>
      last.next_cursor ?? undefined,
    refetchOnMount: "always",
  });
}

/** Marks every Credits read stale and refetches the ones on screen. */
export function refreshCredits(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: creditKeys.all });
}

function useUserId(): string | null {
  const { user } = useAuth();
  return user?.id ?? null;
}

/** The signed-in account's Balance; idle while nobody is signed in. */
export function useCreditBalance() {
  const userId = useUserId();
  return useQuery({
    ...creditBalanceQuery(userId ?? ""),
    enabled: !!userId,
  });
}

export function useCreditHistory() {
  const userId = useUserId();
  return useInfiniteQuery({
    ...creditHistoryQuery(userId ?? ""),
    enabled: !!userId,
  });
}

/**
 * The Request credits `mailto:` for the signed-in account: its email once
 * `/auth/me` has answered, and `balanceMinor` when the caller has one.
 */
export function useCreditRequestHref(balanceMinor: number | null | undefined) {
  const { user } = useAuth();
  const email = user && isHydratedUser(user) ? user.email : null;
  return creditRequestHref({ email, balanceMinor });
}

/**
 * Refetches the Balance and the History whenever a `credits` carrier lands on
 * a chat answer. The carriers already on screen when the chat mounts are
 * taken as seen; each one after that is a landing.
 */
export function useRefreshCreditsOnCarrier(messages: readonly unknown[]) {
  const queryClient = useQueryClient();
  const seen = useRef<Set<string> | null>(null);
  const signatures = useMemo(
    () => creditsCarrierSignatures(messages),
    [messages],
  );

  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set(signatures);
      return;
    }
    if (noteNewCarriers(seen.current, signatures)) {
      void refreshCredits(queryClient);
    }
  }, [signatures, queryClient]);
}
