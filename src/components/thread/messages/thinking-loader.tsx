"use client";

import { motion } from "framer-motion";

const GRADIENT = {
  background: "linear-gradient(30deg, #063BAA 0%, #96E7CD 100%)",
};

function Spinner() {
  return (
    <div className="relative h-4 w-4">
      <motion.div
        className="absolute inset-0 rounded-full opacity-60"
        style={GRADIENT}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-0.5 flex items-center justify-center rounded-full bg-white">
        <div className="h-1.5 w-1.5 rounded-full bg-[#063BAA]" />
      </div>
    </div>
  );
}

/**
 * The reference's chat loader (SoftLoader "chat"): a spinning brand ring and
 * an uppercase status line over a pulsing skeleton card.
 *
 * `finishing` drops the skeleton — the answer is already on screen and the
 * run is only wrapping up (suggestions, the grounding check), so a fake
 * paragraph below it would read as more text coming.
 */
export function ThinkingLoader({
  phase = "thinking",
}: {
  phase?: "thinking" | "finishing";
}) {
  const finishing = phase === "finishing";
  return (
    <div
      role="status"
      aria-label={finishing ? "Finishing up" : "Thinking"}
      className="flex max-w-[85%] flex-col gap-2 py-3 select-none"
    >
      <div className="flex items-center gap-1.5 px-3">
        <Spinner />
        <span className="text-[10px] font-medium tracking-wider text-[#0A1F4D] uppercase">
          {finishing ? "Finishing up…" : "FinSharpeGPT is analyzing..."}
        </span>
      </div>
      {!finishing && (
        <div className="rounded-card rounded-tl-xs border border-slate-100 bg-white p-4 shadow-xs">
          <div className="space-y-2">
            <div className="h-3.5 w-11/12 animate-pulse rounded-md bg-slate-100" />
            <div className="h-3.5 w-5/6 animate-pulse rounded-md bg-slate-100" />
            <div className="h-3.5 w-2/3 animate-pulse rounded-md bg-slate-100" />
          </div>
        </div>
      )}
    </div>
  );
}
