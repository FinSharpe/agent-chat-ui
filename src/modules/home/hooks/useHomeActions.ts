"use client";

import { useCallback } from "react";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useUiStore } from "@/store/useUiStore";
import type { ActionTarget } from "../types/home.types";

/** Discover feature id for its investment-strategies view (see the Discover
 *  page's `pendingDiscoverFeature` handling). */
const DISCOVER_IDEAS = "ideas";

/**
 * Every Home card resolves to one of these: seed a fresh chat, switch tab,
 * deep-link into a Discover feature, or open the guide popup (owned by the
 * page, so it is passed in).
 */
export function useHomeActions(openGuide: () => void) {
  const { createNewChat, setActiveTab } = useAppNavigation();
  const setPendingDiscoverFeature = useUiStore(
    (s) => s.setPendingDiscoverFeature,
  );

  /** Opens a fresh chat whose first message is `prompt`. */
  const askAi = useCallback(
    (prompt?: string) => createNewChat(prompt),
    [createNewChat],
  );

  const runAction = useCallback(
    (target: ActionTarget) => {
      switch (target.action) {
        case "chat":
          createNewChat(target.prompt);
          break;
        case "guide":
          openGuide();
          break;
        case "discover-ideas":
          // Straight into the strategies view rather than Discover's landing.
          setPendingDiscoverFeature(DISCOVER_IDEAS);
          setActiveTab("discover");
          break;
        default:
          setActiveTab(target.action);
      }
    },
    [createNewChat, openGuide, setActiveTab, setPendingDiscoverFeature],
  );

  return { askAi, runAction, setActiveTab };
}
