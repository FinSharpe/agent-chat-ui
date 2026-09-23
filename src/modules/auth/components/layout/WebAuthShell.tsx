"use client";

import React from "react";
import {
  AnimatedWaveFooter,
  GrainOverlay,
} from "@/components/shared/WavePattern";

interface Props {
  children: React.ReactNode;
}

const FADE =
  "linear-gradient(to bottom, transparent 0%, black 14%, black 100%)";

const LINE = "Ride the finance wave with smarter investments";
const words = LINE.split(" ");
// Index of each word's first letter in the whole line (spaces count as a beat).
const offsets = words.map((_, i) =>
  words.slice(0, i).reduce((n, w) => n + w.length + 1, 0),
);
const START = 6; // beats to wait so the waves settle in first
const STEP = 0.045; // seconds between letters

// Desktop sign-in: one large main card. Inside it, on the left, a dark-blue
// media card — the moving wave fills the whole card, diffused and grainy, with
// a line that types itself in over it — and on the right the whole sign-in
// flow (Welcome, Sign in, Sign up, OTP…), cardless like the rest of the app.
// The flow column has a fixed width, so the media card takes all the remaining
// room. The layout keeps this mounted across auth routes, so the media card
// stays still while only the flow column animates between screens.
export default function WebAuthShell({ children }: Props) {
  return (
    <div className="h-full w-full bg-[#F3F6FB] p-4 dark:bg-[#050B14]">
      <div className="rounded-card premium-shadow-sm flex h-full w-full gap-3 overflow-hidden border border-slate-100 bg-white p-3 dark:border-slate-800/50 dark:bg-[#0C1524]">
        <section
          className="relative isolate min-w-0 flex-1 overflow-hidden rounded-[12px]"
          style={{
            background:
              "linear-gradient(160deg, #0A1F4D 0%, #0A2359 55%, #0B2A66 100%)",
          }}
          aria-hidden="true"
        >
          {/* Diffused: blurred, and oversized so the blur never shows an edge. */}
          <div
            className="pointer-events-none absolute -inset-8 select-none"
            style={{
              filter: "blur(12px)",
              WebkitMaskImage: FADE,
              maskImage: FADE,
              transform: "translateZ(0)",
              willChange: "transform",
            }}
          >
            <AnimatedWaveFooter
              palette="mw"
              bare
            />
          </div>
          <GrainOverlay />
          {/* The line alone, centred in the card */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center select-none">
            <p className="font-geist px-12 text-center text-[17px] leading-[1.5] tracking-[0.01em] text-white">
              <span className="sr-only">{LINE}</span>
              <span aria-hidden="true">
                {words.map((w, wi) => (
                  <React.Fragment key={wi}>
                    <span className="inline-block whitespace-nowrap">
                      {[...w].map((ch, ci) => (
                        <span
                          key={ci}
                          className="type-focus-char"
                          style={{
                            animationDelay: `${(START + offsets[wi] + ci) * STEP}s`,
                          }}
                        >
                          {ch}
                        </span>
                      ))}
                    </span>
                    {wi < words.length - 1 && " "}
                  </React.Fragment>
                ))}
              </span>
            </p>
          </div>
        </section>

        <div className="scrollbar-none flex w-[calc(460px*var(--wx,1))] shrink-0 overflow-y-auto">
          <div className="m-auto w-full max-w-[400px] px-6 py-8">
            <div className="flex min-h-[520px] flex-col">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
