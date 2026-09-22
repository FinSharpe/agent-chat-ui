"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";

/**
 * The reference's Discover feature host, for a feature that is its own
 * route: the page slides in from the right and, on desktop, sits in the same
 * centred column as the Discover landing. It is clipped to the panel — the
 * screen inside owns its scrolling, as every page in the shell does.
 */
export function FeatureFrame({ children }: { children: ReactNode }) {
  const isDesktopWeb = useIsDesktopWeb();

  return (
    <div className="font-funnel relative h-full w-full flex-1 overflow-hidden bg-transparent">
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22 }}
        className="absolute inset-0 flex flex-col"
      >
        {isDesktopWeb ? (
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
