"use client";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders a full-page overlay (the watchlist popups) into the Import page's
 * root rather than inside its scroller, so on mobile the overlay's
 * `absolute inset-0` covers the page like the reference's screen-level
 * overlays do, whatever section opened it. Desktop overlays go through
 * OverlayRoot/PopupFrame, which portal to the main panel themselves.
 */
export function ImportOverlayPortal({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setHost(document.querySelector<HTMLElement>("[data-import-root]"));
  }, []);
  return host ? createPortal(children, host) : null;
}
