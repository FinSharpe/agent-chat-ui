"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface HeroSlide {
  title: string;
  subtitle?: string;
}

interface Props {
  slides: HeroSlide[];
  autoMs?: number;
  className?: string;
  showArrows?: boolean;
}

// Auto-rotating hero carousel with dot indicators, reused across Discover /
// Import / Memory landing pages. Slides are real scroll-snapped elements
// (same pattern as the Home screen's Features carousel) so the whole card —
// background included — moves as one, not just the text inside it.
// snap-always forces the scroll to stop at every card even on a fast swipe,
// so a drag always advances one card at a time instead of flying to the end.
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function HeroCarousel({ slides, autoMs = 4500, className = "", showArrows = false }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrame = useRef<number | null>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);

  // Manually animates scrollLeft frame-by-frame instead of using native
  // scrollTo({behavior:"smooth"}) — combined with CSS scroll-snap, the browser's
  // snap engine treats any in-flight position that isn't itself a snap point as
  // invalid and keeps yanking scrollLeft back to the nearest one, so the visible
  // motion collapses into a single instant jump right as the eased curve crosses
  // the snap threshold. Turning scroll-snap off for the container only while our
  // own animation runs (then restoring it once we land exactly on the target)
  // sidesteps that fight and gives a real, visible slide every time.
  const scrollToIndex = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = (idx + slides.length) % slides.length;
    const child = el.children[clamped] as HTMLElement | undefined;
    if (!child) return;

    const start = el.scrollLeft;
    const target = child.offsetLeft;
    const distance = target - start;
    if (Math.abs(distance) < 1) return;

    if (animFrame.current) cancelAnimationFrame(animFrame.current);
    el.style.scrollSnapType = "none";
    const duration = 420;
    const startTime = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      el.scrollLeft = start + distance * easeInOutCubic(t);
      if (t < 1) {
        animFrame.current = requestAnimationFrame(step);
      } else {
        animFrame.current = null;
        el.style.scrollSnapType = "";
      }
    };
    animFrame.current = requestAnimationFrame(step);
  }, [slides.length]);

  const restartAutoplay = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    if (slides.length <= 1) return;
    timer.current = setInterval(() => {
      scrollToIndex(activeRef.current + 1);
    }, autoMs);
  }, [slides.length, autoMs, scrollToIndex]);

  useEffect(() => {
    restartAutoplay();
    return () => {
      if (timer.current) clearInterval(timer.current);
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [restartAutoplay]);

  // Tracks the active dot from real scroll position, and — since this fires for
  // drags, dot clicks and arrow clicks alike — resets the autoplay clock once
  // scrolling settles, so autoplay never yanks the user forward right after
  // they've just navigated manually.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || slides.length <= 1) return;

    const handleScroll = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      const idx = maxScroll > 0 ? Math.round((el.scrollLeft / maxScroll) * (slides.length - 1)) : 0;
      const clamped = Math.max(0, Math.min(slides.length - 1, idx));
      activeRef.current = clamped;
      setActive(clamped);

      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(restartAutoplay, 150);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [slides.length, restartAutoplay]);

  return (
    <div className={`w-full flex flex-col gap-2.5 ${className}`}>
      {/* Card strip — each slide is its own full-width, scroll-snapped element */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-3 scrollbar-none pb-1"
        >
          {slides.map((s, idx) => (
            <div
              key={idx}
              className="relative min-w-full w-full snap-start snap-always bg-brand-gradient rounded-card overflow-hidden text-white p-6 min-h-[128px] flex flex-col justify-center select-none"
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="relative pr-16">
                <h3 className="text-base font-geist font-medium leading-snug">{s.title}</h3>
                {s.subtitle && <p className="text-[11px] text-white mt-1 leading-relaxed">{s.subtitle}</p>}
              </div>
            </div>
          ))}
        </div>

        {slides.length > 1 && showArrows && (
          /* Arrows */
          <div className="absolute right-4 top-4 flex gap-1.5">
            <button onClick={() => scrollToIndex(active - 1)} className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
              <ChevronLeft size={13} />
            </button>
            <button onClick={() => scrollToIndex(active + 1)} className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Outside Dots indicators */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-0.5 select-none" aria-hidden>
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToIndex(idx)}
              className="carousel-dot cursor-pointer"
              data-active={idx === active}
            />
          ))}
        </div>
      )}
    </div>
  );
}
