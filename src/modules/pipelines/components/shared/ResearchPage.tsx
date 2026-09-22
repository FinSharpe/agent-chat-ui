"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { useDesktopLayout } from "../../hooks/useDesktopLayout";

/**
 * The frame every research page sits in — the reference's Discover feature
 * host: the page slides in from the right, and on desktop it is held in the
 * same centred column the Discover landing uses rather than running out to
 * the panel edges.
 *
 * The page owns its scrolling (the app shell never scrolls the window), so
 * this is a clipped, full-height box; each screen puts its own scroller under
 * its header.
 */
export function ResearchPage({
  children,
  animate = true,
}: {
  children: ReactNode;
  /** Off where the page is already on screen and only its content changed. */
  animate?: boolean;
}) {
  const desktop = useDesktopLayout();

  return (
    <div className="font-funnel relative h-full w-full flex-1 overflow-hidden bg-transparent">
      <motion.div
        initial={animate ? { opacity: 0, x: 24 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22 }}
        className="absolute inset-0 flex flex-col"
      >
        {desktop ? (
          <div className="mx-auto flex h-full min-h-0 w-full max-w-[calc(804px*var(--wx,1))] flex-col">
            {children}
          </div>
        ) : (
          children
        )}
      </motion.div>
    </div>
  );
}
