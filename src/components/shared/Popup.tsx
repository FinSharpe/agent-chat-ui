"use client";

import React, { createContext, useContext, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, type HTMLMotionProps } from "framer-motion";
import useIsDesktopWeb, { IS_WEB_BUILD } from "@/hooks/useIsDesktopWeb";

/* Desktop web shows detail screens (a strategy, an analysis, a video, an
   article, an add-form…) as a popup over the page that opened them, instead
   of replacing the page the way mobile does. Mobile is untouched: OverlayRoot
   renders exactly the motion.div it replaces, and the Discover detail hosts
   only mount a PopupFrame on desktop. */

/** True inside a PopupFrame — lets shared headers swap "back" for "close". */
export const PopupContext = createContext(false);
export const useInPopup = () => useContext(PopupContext);

interface FrameProps {
  onClose?: () => void;
  children: React.ReactNode;
  /** Extra classes for the card. */
  className?: string;
  /** Size the card to its content (forms, short views) rather than filling
   *  the available height. */
  fit?: boolean;
  z?: number;
}

/** Dimmed backdrop + centred card, portalled into the main panel so it is
 *  always centred on it whatever scroll container triggered it. */
export function PopupFrame({ onClose, children, className = "", fit = false, z = 80 }: FrameProps) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const node = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{ zIndex: z }}
      className="absolute inset-0 flex items-center justify-center p-6 backdrop-blur-md"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[calc(720px*var(--wx,1))] max-h-full ${fit ? "" : "h-full"} rounded-card bg-white dark:bg-[#0C1524] shadow-[0_24px_60px_rgba(10,31,77,0.28)] overflow-hidden flex flex-col font-funnel ${className}`}
      >
        <PopupContext.Provider value={true}>{children}</PopupContext.Provider>
      </motion.div>
    </motion.div>
  );

  const target = typeof document !== "undefined" ? document.querySelector<HTMLElement>("[data-popup-root]") : null;
  return target ? createPortal(node, target) : node;
}

type RootProps = Omit<HTMLMotionProps<"div">, "children" | "className"> & {
  className: string; children?: React.ReactNode; onClose?: () => void; fit?: boolean;
};

/** Drop-in for a full-screen overlay's root motion.div: identical on mobile,
 *  a popup on desktop web (its own animation, positioning and z-index are
 *  replaced; the remaining classes carry over to the card). */
export function OverlayRoot({ className, onClose, fit, children, ...motionProps }: RootProps) {
  // Overlays mount after user interaction, so reading the window directly is
  // safe and avoids a first frame in the mobile layout before the hook settles.
  const hookSaysDesktop = useIsDesktopWeb();
  const isDesktopWeb = hookSaysDesktop || (IS_WEB_BUILD && typeof window !== "undefined" && window.innerWidth >= 1024);
  if (!isDesktopWeb) {
    return <motion.div className={className} {...motionProps}>{children}</motion.div>;
  }
  const z = Number(/z-\[?(\d+)\]?/.exec(className)?.[1] ?? 80) + 20;
  const cardClasses = className
    .replace(/absolute inset-0/, "")
    .replace(/z-\[?\d+\]?/, "")
    .replace(/pointer-events-auto/, "");
  return <PopupFrame onClose={onClose} fit={fit} z={z} className={cardClasses}>{children}</PopupFrame>;
}
