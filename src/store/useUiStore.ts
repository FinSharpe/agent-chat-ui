"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

/**
 * App-shell UI state shared across pages: theme, sidebar, the full-screen
 * overlays the shell hosts, and a prompt handed from any screen to Chat.
 *
 * Routing is Next's (see `useAppNavigation`); nothing here duplicates it.
 */
interface UiStore {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;

  /** Desktop sidebar collapsed to an icon rail. */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  /** Mobile chat-history drawer (the desktop sidebar lists chats inline). */
  isHistoryDrawerOpen: boolean;
  setHistoryDrawerOpen: (open: boolean) => void;

  /** Profile overlay, opened from the identity row / header avatar menu. */
  profileSettingsOpen: boolean;
  setProfileSettingsOpen: (open: boolean) => void;
  assistantOpen: boolean;
  setAssistantOpen: (open: boolean) => void;

  /**
   * A message to send as the first turn of a fresh chat. Set by
   * `useStartChat` from any screen; Chat submits it once and clears it.
   */
  pendingPrompt: string | null;
  setPendingPrompt: (prompt: string | null) => void;

  /**
   * When a screen deep-links into one Discover feature, Discover opens
   * straight to it instead of its landing view.
   */
  pendingDiscoverFeature: string | null;
  setPendingDiscoverFeature: (feature: string | null) => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      themeMode: "light",
      setThemeMode: (themeMode) => set({ themeMode }),
      toggleThemeMode: () =>
        set((s) => ({ themeMode: s.themeMode === "light" ? "dark" : "light" })),

      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      isHistoryDrawerOpen: false,
      setHistoryDrawerOpen: (isHistoryDrawerOpen) =>
        set({ isHistoryDrawerOpen }),

      profileSettingsOpen: false,
      setProfileSettingsOpen: (profileSettingsOpen) =>
        set({ profileSettingsOpen }),
      assistantOpen: false,
      setAssistantOpen: (assistantOpen) => set({ assistantOpen }),

      pendingPrompt: null,
      setPendingPrompt: (pendingPrompt) => set({ pendingPrompt }),

      pendingDiscoverFeature: null,
      setPendingDiscoverFeature: (pendingDiscoverFeature) =>
        set({ pendingDiscoverFeature }),
    }),
    {
      name: "finsharpe.ui",
      storage: createJSONStorage(() => localStorage),
      // Only preferences survive a reload; overlays and hand-offs never do.
      partialize: (s) => ({
        themeMode: s.themeMode,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    },
  ),
);
