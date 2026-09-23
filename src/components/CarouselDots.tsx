"use client";

import React, { useEffect, useState } from "react";

interface CarouselDotsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  count: number;
  /** "dots" (default): a row of dots, one per slide. "counter": a single
   *  small "current/total" label — cleaner when the slide count is high
   *  enough that a dot row starts to feel busy. */
  variant?: "dots" | "counter";
  /** Overrides the wrapper's own layout classes (default centers it below
   *  the carousel) — for the "counter" variant used as a badge pinned to a
   *  corner of the card itself, e.g. "absolute top-4 right-4 z-20". */
  className?: string;
}

// Tracks horizontal scroll progress of a snap-carousel and renders a dot
// indicator (or a "1/8"-style counter), so users know there are more cards
// to swipe through.
export default function CarouselDots({ containerRef, count, variant = "dots", className }: CarouselDotsProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || count <= 1) return;

    const handleScroll = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) {
        setActive(0);
        return;
      }
      const progress = el.scrollLeft / maxScroll;
      const idx = Math.round(progress * (count - 1));
      setActive(Math.max(0, Math.min(count - 1, idx)));
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener("scroll", handleScroll);
  }, [containerRef, count]);

  if (count <= 1) return null;

  if (variant === "counter") {
    return (
      <div className={className ?? "flex items-center justify-center pt-1.5 select-none"} aria-hidden>
        <span className="text-[10px] font-medium text-[#0A1F4D] bg-white px-2 py-0.5 rounded-full tabular-nums tracking-wide">
          {active + 1}/{count}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1.5 pt-1.5 select-none" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="carousel-dot" data-active={i === active} />
      ))}
    </div>
  );
}
