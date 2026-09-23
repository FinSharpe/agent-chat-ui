"use client";

import { useEffect, useState } from "react";

/**
 * The app is the reference design's responsive web build: a single mobile
 * column (header + bottom nav) below the sidebar breakpoint, a desktop
 * sidebar + main panel at and above it. Kept as constants so screens ported
 * from the reference read the same.
 */
export const IS_WEB_BUILD = true;
export const IS_FULL_BLEED = true;

/** Width at which the desktop sidebar layout takes over. */
export const DESKTOP_BREAKPOINT = 1024;

/** True once the window is wide enough for the desktop sidebar layout. */
export default function useIsDesktopWeb(breakpoint = DESKTOP_BREAKPOINT) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isDesktop;
}
