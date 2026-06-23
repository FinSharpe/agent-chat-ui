"use client";

/**
 * ThinkingLoader — "Indeterminate Shimmer".
 *
 * A single full-chat-width hairline: a faint brand-tinted track with one soft
 * glint gliding across it. The glint sweep is the only motion, so the loader
 * takes the eye without shouting. Styling + the `thinking-shimmer` keyframe
 * live in globals.css (section 8) and read brand tokens, so it follows light
 * and dark mode automatically and rests calmly under prefers-reduced-motion.
 */
export function ThinkingLoader() {
  return (
    <div
      role="status"
      aria-label="Thinking"
      className="flex w-full items-center py-3"
    >
      <div
        aria-hidden="true"
        className="thinking-shimmer"
      />
      <span className="sr-only">Thinking…</span>
    </div>
  );
}
