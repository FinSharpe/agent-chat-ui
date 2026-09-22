"use client";

import React, { useEffect, useState } from "react";
import {
  FloatingPortalContainerContext,
  PortalContainerContext,
} from "@/components/ui/portal-container";
import { useUiStore } from "@/store/useUiStore";

// Desktop scales the whole UI to the window so it looks the same on every
// screen. The reference is the laptop the design was tuned on: about
// 1536 x 826 CSS px of page (CSS px already account for OS display scaling
// and browser zoom).
//
// - scale (zoom): fits both dimensions, min(width / 1536, height / 826), so
//   the same amount of the UI is visible vertically on any window.
// - wx: when the window is wider than the laptop's shape, --wx stretches the
//   sidebar, content column and popups by that ratio, so their proportions
//   to the window width stay the same too.
const REF_W = 1536;
const REF_H = 826;
const MIN_SCALE = 0.6;
const MAX_SCALE = 2.5;
const MAX_WX = 1.35;
const MIN_WX = 0.8;
// Overall UI size: everything is drawn this much larger than the reference
// layout; layout widths are divided back through --wx.
const UI_SCALE = 1.07;

interface ViewportState {
  scale: number;
  wx: number;
  w: number;
  h: number;
  desktop: boolean;
}

function computeScale(): ViewportState {
  const w = window.innerWidth;
  const h = window.innerHeight;
  // Phone / narrow layout is never scaled.
  if (w < 1024) return { scale: 1, wx: 1, w, h, desktop: false };
  let base = Math.min(
    Math.max(Math.min(w / REF_W, h / REF_H), MIN_SCALE),
    MAX_SCALE,
  );
  if (Math.abs(base - 1) < 0.03) base = 1;
  const scale = Math.round(Math.min(base * UI_SCALE, MAX_SCALE) * 100) / 100;
  const wx =
    Math.round(Math.min(Math.max(w / scale / REF_W, MIN_WX), MAX_WX) * 1000) /
    1000;
  return { scale, wx, w, h, desktop: true };
}

function useViewportScale() {
  const [state, setState] = useState<ViewportState>({
    scale: 1,
    wx: 1,
    w: 0,
    h: 0,
    desktop: false,
  });
  useEffect(() => {
    const update = () => setState(computeScale());
    update();
    // iPad/iPhone Safari resize the visual viewport as toolbars show and
    // hide, and rotate without always firing a plain resize.
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);
  return state;
}

/**
 * The window-filling frame every signed-in and auth screen renders in:
 * applies the theme, scales the UI to the window on desktop, and hosts the
 * Radix portal root so overlays scale and theme with the page.
 */
export default function AppViewport({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeMode = useUiStore((s) => s.themeMode);
  const { scale, wx, w, h, desktop } = useViewportScale();
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null);
  const [floatingRoot, setFloatingRoot] = useState<HTMLDivElement | null>(null);
  const dark = themeMode === "dark";

  return (
    <>
      <div
        className={`${desktop ? "" : "h-[100dvh] w-full"} flex flex-col overflow-hidden ${
          dark ? "dark bg-[#050B14]" : "bg-[#FFFFFF]"
        }`}
        // Desktop: pinned to the window and sized in exact px as
        // (window / scale), then zoomed by scale, so it fills the window
        // exactly. Pixel sizes rather than vw/dvh: Safari resolves viewport
        // units inside a zoomed box differently from Chrome.
        style={{
          ["--wx" as string]: wx,
          ...(desktop
            ? {
                position: "fixed",
                top: 0,
                left: 0,
                width: `${w / scale}px`,
                height: `${h / scale}px`,
                ...(scale === 1 ? {} : { zoom: scale }),
              }
            : {}),
        }}
      >
        <div
          ref={setPortalRoot}
          data-app-mode="web"
          className="bg-background relative flex h-full w-full flex-1 flex-col overflow-hidden"
        >
          <PortalContainerContext.Provider value={portalRoot}>
            <FloatingPortalContainerContext.Provider value={floatingRoot}>
              {children}
            </FloatingPortalContainerContext.Provider>
          </PortalContainerContext.Provider>
        </div>
      </div>
      {/* Unzoomed root for anchored overlays (see portal-container.tsx). */}
      <div
        ref={setFloatingRoot}
        data-app-mode="web"
        className={dark ? "dark" : undefined}
        style={{ ["--app-zoom" as string]: scale }}
      />
    </>
  );
}
