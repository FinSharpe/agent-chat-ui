"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, Lightbulb, X } from "lucide-react";
import { OverlayRoot } from "@/components/shared/Popup";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { GUIDE_SECTIONS } from "../../constants/guide";
import type { GuideSection } from "../../types/home.types";

const LEVEL_TONE: Record<GuideSection["level"], string> = {
  "Start here": "bg-[#97edcc]/25 text-[#0A9E6E]",
  "Go deeper": "bg-[#063BAA]/8 text-[#063BAA]",
  Advanced: "bg-amber-50 text-amber-600",
};

/** "FinSharpeGPT Guide" — six accordion sections, easy → advanced. A popup on
 *  desktop, a full-screen sheet over Home on mobile. */
export function GuideOverlay({ onClose }: { onClose: () => void }) {
  const isDesktopWeb = useIsDesktopWeb();
  // First section open so the guide never opens fully collapsed.
  const [open, setOpen] = useState<string | null>(GUIDE_SECTIONS[0].id);

  return (
    <OverlayRoot
      onClose={onClose}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="font-funnel absolute inset-0 z-[70] flex flex-col overflow-hidden bg-white select-none"
    >
      <div className="h-[56px] shrink-0 border-b border-slate-50 px-5">
        <div
          className={`flex h-full items-center justify-between ${isDesktopWeb ? "mx-auto w-full max-w-[calc(680px*var(--wx,1))]" : ""}`}
        >
          <div className="flex items-center gap-2.5">
            <BookOpen
              size={16}
              className="text-[#063BAA]"
            />
            <div>
              <h2 className="font-geist text-sm leading-tight font-medium text-[#0A1F4D]">
                FinSharpeGPT Guide
              </h2>
              <p className="text-[10px] text-slate-400">
                Everything the app can do, simplest first
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="hover-tint flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-100 text-[#0A1F4D] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div
        className={`scrollbar-none flex-1 overflow-y-auto ${isDesktopWeb ? "px-5 py-4 pb-16" : "px-5 py-4 pb-[130px]"}`}
      >
        <div
          className={
            isDesktopWeb
              ? "mx-auto max-w-[calc(680px*var(--wx,1))] space-y-3"
              : "space-y-3"
          }
        >
          <div className="bg-brand-gradient rounded-card relative overflow-hidden p-6 text-white">
            <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
            <div className="relative space-y-1.5">
              <h3 className="font-geist text-base font-medium">
                New here? Start at the top.
              </h3>
              <p className="max-w-[560px] text-[11.5px] leading-relaxed text-white">
                These six sections build on each other — the first two get you
                useful answers in minutes, the rest unlock the deeper analysis
                once your accounts are connected.
              </p>
            </div>
          </div>

          {GUIDE_SECTIONS.map((s) => {
            const Icon = s.icon;
            const isOpen = open === s.id;
            return (
              <div
                key={s.id}
                className="glass-card rounded-card overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : s.id)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3.5 p-4.5 text-left transition-colors hover:bg-[#063BAA]/[0.05] ${
                    isOpen ? "border-b border-slate-50" : ""
                  }`}
                >
                  <div className="rounded-nested flex h-10 w-10 shrink-0 items-center justify-center bg-[#063BAA]/8 text-[#063BAA]">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-medium tracking-wider uppercase ${LEVEL_TONE[s.level]}`}
                    >
                      {s.level}
                    </span>
                    <h3 className="font-geist text-[13px] font-medium text-[#0A1F4D]">
                      {s.title}
                    </h3>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen && (
                  <div className="space-y-4 p-4.5">
                    <p className="text-[11.5px] leading-relaxed text-slate-500">
                      {s.summary}
                    </p>

                    <div className="space-y-3">
                      {s.steps.map((step, i) => (
                        <div
                          key={step.title}
                          className="flex gap-3"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#063BAA]/8 text-[9px] font-medium text-[#063BAA]">
                            {i + 1}
                          </span>
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-geist text-[12px] font-medium text-[#0A1F4D]">
                              {step.title}
                            </p>
                            <p className="text-[11px] leading-relaxed text-slate-500">
                              {step.body}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {s.tip && (
                      <div className="rounded-nested flex gap-2.5 bg-[#97edcc]/15 p-3.5">
                        <Lightbulb
                          size={14}
                          className="mt-0.5 shrink-0 text-[#0A9E6E]"
                        />
                        <p className="home-guide-tip text-[11px] leading-relaxed text-slate-600">
                          {s.tip}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </OverlayRoot>
  );
}
