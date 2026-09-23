"use client";

/**
 * Resolve chart colour tokens to concrete values.
 *
 * Recharts writes `stroke` / `fill` as SVG presentation *attributes*, and a
 * `var(--chart-1)` there is not parsed as a custom property — it silently
 * renders as no colour. So the tokens are read off the document once and
 * re-read whenever the theme class changes, which keeps the single source of
 * truth in `globals.css` rather than duplicating hexes in TypeScript.
 */

import { useEffect, useState } from "react";

import { BENCHMARK_HUE_VAR, SELF_HUE_VARS } from "../utils/chart-data";

const TOKENS = [
  ...SELF_HUE_VARS,
  BENCHMARK_HUE_VAR,
  "--chart-grid",
  "--chart-negative",
  "--text-tertiary",
  "--bg-card",
] as const;

export type ChartTokens = Record<string, string>;

/** Fallbacks matching globals.css light mode, for the first paint and SSR. */
const FALLBACK: ChartTokens = {
  "--chart-1": "#2563eb",
  "--chart-2": "#14b8a6",
  "--chart-3": "#6366f1",
  "--chart-4": "#f59e0b",
  "--chart-5": "#a855f7",
  "--chart-benchmark": "#57534e",
  "--chart-grid": "rgba(15, 23, 42, 0.08)",
  "--chart-negative": "#dc2626",
  "--text-tertiary": "#6b7280",
  "--bg-card": "#ffffff",
};

/**
 * The element whose computed style carries the live theme.
 *
 * The app shell puts its `dark` class on the viewport frame around
 * `[data-app-mode]`, not on <html>, so the tokens are read from inside that
 * frame; a page outside the shell falls back to the document root.
 */
function themedElement(): Element {
  return document.querySelector("[data-app-mode]") ?? document.documentElement;
}

function read(): ChartTokens {
  if (typeof window === "undefined") return FALLBACK;
  const styles = getComputedStyle(themedElement());
  const resolved: ChartTokens = { ...FALLBACK };
  for (const token of TOKENS) {
    const value = styles.getPropertyValue(token).trim();
    if (value) resolved[token] = value;
  }
  return resolved;
}

export function useChartTokens(): ChartTokens {
  const [tokens, setTokens] = useState<ChartTokens>(FALLBACK);

  useEffect(() => {
    setTokens(read());
    // Re-resolve when the theme class flips — on <html>, or on the shell's
    // viewport frame that wraps `[data-app-mode]`.
    const observer = new MutationObserver(() => setTokens(read()));
    const targets = new Set<Element>([document.documentElement]);
    const frame = themedElement().parentElement;
    if (frame) targets.add(frame);
    for (const target of targets) {
      observer.observe(target, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
    return () => observer.disconnect();
  }, []);

  return tokens;
}
