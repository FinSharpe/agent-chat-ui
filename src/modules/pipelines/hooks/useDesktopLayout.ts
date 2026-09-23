"use client";

import { useSyncExternalStore } from "react";

import { DESKTOP_BREAKPOINT } from "@/hooks/useIsDesktopWeb";

/**
 * Whether the desktop sidebar layout is in force — the same breakpoint as
 * `useIsDesktopWeb`, read synchronously.
 *
 * The research screens swap their whole frame on it (a popup over the catalog
 * on desktop, a full page on mobile). `useIsDesktopWeb` settles in an effect,
 * so every client-side navigation into one of them would paint the mobile
 * frame for a frame first. An external store is read during render instead,
 * and still reports "not desktop" while hydrating so the server HTML matches.
 */
const QUERY = `(min-width: ${DESKTOP_BREAKPOINT}px)`;

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function useDesktopLayout(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
