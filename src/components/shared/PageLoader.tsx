"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import InteractiveWave from "@/components/InteractiveWave";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

/** How long a wait stays blank before the loader shows. */
export const PAGE_LOADER_GRACE_MS = 200;
/** The loader's own fade-in once the grace has passed. */
export const PAGE_LOADER_FADE_IN_MS = 160;
/** Once shown, the loader stays at least this long, so it reads as intended. */
export const PAGE_LOADER_MIN_SHOWN_MS = 400;
/** Loader out, content in. */
export const PAGE_LOADER_CROSS_FADE_MS = 240;

const EASE = "cubic-bezier(0.2, 0, 0, 1)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** `#8FB4FF`, the dark theme's interactive blue: the brand blue at 5–8% vanishes on the dark canvas. */
const DARK_RIBBON_BLUE = "143, 180, 255";

/**
 * **The app's one full-page loader**, after finsharpe-mobile's `FsPageLoader`
 * (#153, ADR-0018): the Welcome screen's ribbon with the logo mark centred on
 * it — no wordmark, no copy. Change the two together.
 *
 * It fills the region that is actually waiting — the body under a screen's
 * header, a popup's body under its title bar — so Back stays one click away.
 * A section still arriving inside a page that is already drawn keeps its
 * skeleton; chat's assistant turn keeps its own loader.
 *
 * Nothing shows for the grace: the loader claims its region from the first
 * frame but is transparent and silent to screen readers, then fades in. Put
 * it under a {@link PageLoaderSwitch}, which holds it for a minimum once
 * shown and cross-fades to the content. Needs a bounded region: it grows to
 * fill a flex column.
 */
export function PageLoader({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useMediaQuery(REDUCED_MOTION);
  const [visible, setVisible] = useState(false);
  const [dark, setDark] = useState(false);

  useLayoutEffect(() => {
    setDark(!!rootRef.current?.closest(".dark"));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setVisible(true),
      PAGE_LOADER_GRACE_MS,
    );
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      className={cn(
        "relative flex min-h-[240px] w-full flex-1 items-center justify-center overflow-hidden select-none",
        className,
      )}
      style={{
        opacity: visible ? 1 : 0,
        transition: reduced
          ? undefined
          : `opacity ${PAGE_LOADER_FADE_IN_MS}ms ${EASE}`,
      }}
    >
      {visible && <span className="sr-only">Loading</span>}
      {/* The Welcome ribbon's own placement: a box 140% × 120% of the region,
          offset −20% / −10%, rotated −8°, clipped. Mounted with the reveal so
          nothing animates while the loader is still invisible. */}
      {visible && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
        >
          <InteractiveWave
            variant="color"
            baseAmplitude={80}
            waveCount={12}
            baseSpeed={0.012}
            baseFrequency={0.0009}
            blue={dark ? DARK_RIBBON_BLUE : undefined}
            still={reduced}
            className="-top-[10%] -left-[20%] h-[120%] w-[140%] rotate-[-8deg]"
          />
        </div>
      )}
      {/* The gradient mark vanishes into the dark canvas; the white one is what the dark shell draws. */}
      <Image
        src="/logo/Finsharpe Logo - Icon.svg"
        alt=""
        aria-hidden
        width={64}
        height={64}
        priority
        className="relative size-16 dark:hidden"
      />
      <Image
        src="/logo/Finsharpe Logo - Icon - White.svg"
        alt=""
        aria-hidden
        width={64}
        height={64}
        priority
        className="relative hidden size-16 dark:block"
      />
    </div>
  );
}

type Phase =
  /** The page. */
  | "page"
  /** The loader, waiting on the page. */
  | "loading"
  /** The page has arrived; the loader is held to its minimum. */
  | "holding"
  /** Loader out, page in. */
  | "fading";

/**
 * Swaps a region between its {@link PageLoader} and whatever replaces it —
 * the content, an empty state, an error — with the flash guard the loader
 * alone cannot give, as mobile's `FsPageLoaderSwitcher`:
 *
 * - a wait that ends inside the grace never showed the loader, so the page
 *   simply appears;
 * - a loader that did show stays until it has been visible for the minimum,
 *   then cross-fades to the page (a cut under reduced motion).
 *
 * `children` is the page, and is only mounted once `loading` is false. The
 * switch is a flex column that grows to fill its parent; the page keeps its
 * state through the cross-fade.
 */
export function PageLoaderSwitch({
  loading,
  children,
  className,
}: {
  loading: boolean;
  children: ReactNode;
  className?: string;
}) {
  const reduced = useMediaQuery(REDUCED_MOTION);
  const [phase, setPhase] = useState<Phase>(loading ? "loading" : "page");
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const startedAt = useRef(loading ? Date.now() : 0);

  useEffect(() => {
    if (loading) {
      // A fresh wait restarts the clock; waiting again during the hold or
      // the fade keeps the loader that is already on screen.
      if (phaseRef.current === "page") startedAt.current = Date.now();
      setPhase("loading");
      return;
    }
    if (phaseRef.current !== "loading") return;
    const elapsed = Date.now() - startedAt.current;
    if (elapsed < PAGE_LOADER_GRACE_MS) {
      setPhase("page");
      return;
    }
    setPhase("holding");
    const timer = window.setTimeout(
      () => setPhase(reduced ? "page" : "fading"),
      Math.max(0, PAGE_LOADER_GRACE_MS + PAGE_LOADER_MIN_SHOWN_MS - elapsed),
    );
    return () => window.clearTimeout(timer);
    // `reduced` is read at the moment the page arrives, as mobile does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (phase !== "fading") return;
    const timer = window.setTimeout(
      () => setPhase("page"),
      PAGE_LOADER_CROSS_FADE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [phase]);

  const showPage = phase === "page" || phase === "fading";
  const fading = phase === "fading";

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col", className)}>
      {showPage && (
        <div
          key="page"
          className="flex min-h-0 flex-1 flex-col"
          style={
            fading
              ? {
                  animation: `page-loader-in ${PAGE_LOADER_CROSS_FADE_MS}ms ${EASE} both`,
                }
              : undefined
          }
        >
          {children}
        </div>
      )}
      {!showPage || fading ? (
        <div
          key="loader"
          aria-hidden={fading || undefined}
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            fading && "pointer-events-none absolute inset-0",
          )}
          style={
            fading
              ? {
                  animation: `page-loader-out ${PAGE_LOADER_CROSS_FADE_MS}ms ${EASE} both`,
                }
              : undefined
          }
        >
          <PageLoader />
        </div>
      ) : null}
    </div>
  );
}
