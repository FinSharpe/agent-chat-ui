"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** One pass, sweep plus rest — `FsCrestText.period` on mobile. */
const PERIOD_MS = 2800;

/**
 * **The chat's one loading idiom**: a line of text that lights up. After
 * finsharpe-mobile's `FsCrestText` (#132); change the two together.
 *
 * The glyphs sit in muted ink and a soft crest travels through them left to
 * right, then rests before the next pass — no spinner, no dots, no skeleton;
 * the label is the loader. Every crest on screen shares one clock (a negative
 * delay taken from the page's clock), so a new row or new words never restart
 * the sweep out of step with the others. Under reduced motion the crest is
 * dropped and the label sits in full ink. The sweep itself is `.crest-text`
 * in chat.css.
 */
export function CrestText({
  children,
  warning = false,
  className,
}: {
  children: React.ReactNode;
  warning?: boolean;
  className?: string;
}) {
  const [delay] = useState(() =>
    typeof performance === "undefined" ? 0 : -(performance.now() % PERIOD_MS),
  );
  return (
    <span
      className={cn("crest-text", warning && "crest-text--warning", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </span>
  );
}
