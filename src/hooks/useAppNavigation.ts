"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUiStore } from "@/store/useUiStore";

/** The five top-level destinations of the app shell. */
export type TabState = "home" | "chat" | "discover" | "import" | "memory";

export const TAB_ROUTES: Record<TabState, string> = {
  chat: "/",
  home: "/home",
  discover: "/discover",
  import: "/import",
  memory: "/history",
};

/** Which tab a pathname belongs to, or null for pages outside the tabs. */
export function tabForPath(pathname: string): TabState | null {
  if (pathname === "/") return "chat";
  if (pathname.startsWith("/home")) return "home";
  if (pathname.startsWith("/discover")) return "discover";
  if (pathname.startsWith("/import")) return "import";
  if (pathname.startsWith("/history")) return "memory";
  return null;
}

/**
 * Tab navigation over Next routes, shaped like the reference store's
 * `activeTab` / `setActiveTab` / `createNewChat` so ported screens read the
 * same.
 */
export function useAppNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const setPendingPrompt = useUiStore((s) => s.setPendingPrompt);

  const activeTab = tabForPath(pathname);

  const setActiveTab = useCallback(
    (tab: TabState) => router.push(TAB_ROUTES[tab]),
    [router],
  );

  /**
   * Opens a fresh chat. With a prompt, Chat sends it as the first message
   * as soon as it mounts.
   */
  const createNewChat = useCallback(
    (prompt?: string) => {
      setPendingPrompt(prompt?.trim() ? prompt.trim() : null);
      router.push("/");
    },
    [router, setPendingPrompt],
  );

  /** Resumes an existing conversation. */
  const openThread = useCallback(
    (threadId: string) => router.push(`/?threadId=${threadId}`),
    [router],
  );

  return { activeTab, setActiveTab, createNewChat, openThread, pathname };
}
