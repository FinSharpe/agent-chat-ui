"use client";
import { useEffect, useState } from "react";

/**
 * Becomes true the first time the element comes within `rootMargin` of the
 * viewport, then stays true. The Smart Alerts rows use it so each nudge
 * endpoint is only called once its row is about to be seen, as the old
 * collapsed accordions only fetched when opened.
 *
 * `ref` is a callback ref, so an element that mounts after the hook (the
 * equity rows appear only once the equities blob lands, which can be after
 * the MF one) is still observed.
 */
export function useInView<T extends Element>(rootMargin = "400px") {
  const [node, setNode] = useState<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!node || inView) return;
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
    io.observe(node);
    return () => io.disconnect();
  }, [node, inView, rootMargin]);

  return { ref: setNode, inView };
}
