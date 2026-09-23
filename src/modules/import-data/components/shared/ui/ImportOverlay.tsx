"use client";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { OverlayRoot } from "@/components/shared/Popup";
import useIsDesktopWeb, { DESKTOP_BREAKPOINT } from "@/hooks/useIsDesktopWeb";

/** Card surface shared by every Import modal (reference overlay classes). */
const SURFACE =
  "bg-white dark:bg-[#0C1524] flex flex-col overflow-hidden font-funnel text-forest-deep dark:text-white";

const MOTION = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 15 },
  transition: { duration: 0.22, ease: "easeOut" as const },
};

/**
 * The frame every Import modal renders in, matching the reference: on desktop
 * a popup over the main panel (`OverlayRoot` → `PopupFrame`, portalled into
 * `<main data-popup-root>`); on mobile a full-screen panel that slides up over
 * the page and bottom nav.
 *
 * The triggers live deep inside the Import page's cards, so the mobile panel is
 * portalled into the shell's `<main>` as well — rendered in place, its
 * `absolute inset-0` would resolve against whatever card happens to be
 * positioned. Render inside `<AnimatePresence>` so the exit animation plays.
 *
 * The desktop popup sits at z 50 (className z 30 + OverlayRoot's 20) so a
 * Radix confirm dialog opened from inside it (also z 50, mounted later in the
 * DOM) stacks above it.
 */
export function ImportOverlay({
  onClose,
  fit,
  label,
  children,
}: {
  onClose: () => void;
  /** Size the desktop popup to its content (forms) instead of full height. */
  fit?: boolean;
  /** Accessible name for the mobile panel. */
  label?: string;
  children: ReactNode;
}) {
  const hookSaysDesktop = useIsDesktopWeb();
  // Overlays open after a click, so reading the window directly avoids one
  // frame of the mobile layout before the hook settles (same as OverlayRoot).
  const isDesktop =
    hookSaysDesktop ||
    (typeof window !== "undefined" && window.innerWidth >= DESKTOP_BREAKPOINT);

  if (isDesktop) {
    return (
      <OverlayRoot
        onClose={onClose}
        fit={fit}
        {...MOTION}
        className={`absolute inset-0 z-[30] ${SURFACE}`}
      >
        {children}
      </OverlayRoot>
    );
  }
  return (
    <MobilePanel
      onClose={onClose}
      label={label}
    >
      {children}
    </MobilePanel>
  );
}

function MobilePanel({
  onClose,
  label,
  children,
}: {
  onClose: () => void;
  label?: string;
  children: ReactNode;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // The shell's page area (the first <main> in the app frame): the panel
    // covers it and the bottom nav, but not the header — like the reference.
    setTarget(document.querySelector<HTMLElement>("[data-app-mode] main"));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const panel = (
    <motion.div
      {...MOTION}
      aria-label={label}
      className={`absolute inset-0 z-50 ${SURFACE}`}
    >
      {children}
    </motion.div>
  );
  return target ? createPortal(panel, target) : null;
}

/** Round bordered close (X) button used by every modal header. */
export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="hover-tint dark:text-slate-350 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-100 text-slate-400 transition-colors dark:border-slate-800"
    >
      <X size={16} />
    </button>
  );
}

/**
 * Analysis-modal header: blue uppercase title, a one-line summary under it
 * (e.g. "₹12.4L • 15 holdings") and the close button.
 */
export function OverlayHeader({
  title,
  subtitle,
  onClose,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="flex h-[56px] shrink-0 items-center justify-between gap-3 border-b border-slate-50 bg-white px-5 dark:border-slate-800/40 dark:bg-[#0C1524]">
      <div className="flex min-w-0 flex-col">
        <h2 className="truncate text-xs font-medium tracking-wider text-[#063BAA] uppercase dark:text-[#8FB4FF]">
          {title}
        </h2>
        {subtitle && (
          <span className="mt-0.5 truncate text-[9.5px] leading-none font-medium text-slate-400">
            {subtitle}
          </span>
        )}
      </div>
      <CloseButton onClick={onClose} />
    </div>
  );
}

/** Add-form header: green icon + title, close button, description below. */
export function FormOverlayHeader({
  icon,
  title,
  subtitle,
  onClose,
}: {
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="shrink-0 border-b border-slate-50 px-5 pt-4 pb-3 dark:border-slate-800/40">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-[#0A9E6E]">{icon}</span>
          <h2 className="font-geist text-forest-deep truncate text-sm font-medium dark:text-white">
            {title}
          </h2>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      {subtitle && (
        <p className="mt-1.5 text-[10.5px] leading-relaxed text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** The scrolling content column of an analysis modal. */
export function OverlayBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "scrollbar-none flex-1 space-y-6 overflow-y-auto p-5 pb-10",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Pinned action bar: two equal pill buttons (secondary, then primary). */
export function OverlayFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 border-t border-slate-50 bg-white p-5 pt-3 dark:border-slate-800/40 dark:bg-[#0C1524]">
      {children}
    </div>
  );
}

/** Footer pill button: `primary` is the brand gradient, `secondary` outlined,
 *  `danger` a solid rose pill for destructive actions. */
export function FooterButton({
  variant = "primary",
  busy,
  busyLabel,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  /** Show a spinner and `busyLabel` instead of the children. */
  busy?: boolean;
  busyLabel?: ReactNode;
}) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-xs font-medium tracking-wide uppercase transition-all",
        variant === "primary" &&
          "bg-brand-gradient text-white hover:brightness-110 active:scale-98 disabled:pointer-events-none disabled:opacity-40",
        variant === "secondary" &&
          "hover-tint border border-slate-200 text-slate-500 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300",
        variant === "danger" &&
          "bg-rose-500 text-white hover:bg-rose-600 active:scale-98 disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
    >
      {busy ? (
        <>
          <Loader2
            size={13}
            className="animate-spin"
          />
          {busyLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
