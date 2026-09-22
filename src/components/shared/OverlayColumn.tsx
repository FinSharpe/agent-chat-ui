"use client";

import React from "react";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";

/**
 * Wrap the children of a full-panel overlay (sub-page, analysis screen…) so
 * that on desktop web its header and body sit in the same centred column as
 * the pages beneath, instead of running out to the panel edges. On mobile it
 * renders its children untouched.
 */
export default function OverlayColumn({ children }: { children: React.ReactNode }) {
  const isDesktopWeb = useIsDesktopWeb();
  if (!isDesktopWeb) return <>{children}</>;
  return <div className="relative mx-auto w-full max-w-[calc(804px*var(--wx,1))] flex-1 min-h-0 flex flex-col pt-10">{children}</div>;
}
