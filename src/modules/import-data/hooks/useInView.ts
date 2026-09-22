"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Becomes true the first time the element comes within `rootMargin` of the
 * viewport, then stays true. The Smart Alerts rows use it so each nudge
 * endpoint is only called once its row is about to be seen, as the old
 * collapsed accordions only fetched when opened.
 */
export function useInView<T extends Element>(rootMargin = "400px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, rootMargin]);

  return { ref, inView };
}
