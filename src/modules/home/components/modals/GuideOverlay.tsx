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
      className="absolute inset-0 z-[70] bg-white flex flex-col font-funnel overflow-hidden select-none"
    >
      <div className="h-[56px] px-5 shrink-0 border-b border-slate-50">
        <div
          className={`h-full flex items-center justify-between ${isDesktopWeb ? "mx-auto w-full max-w-[calc(680px*var(--wx,1))]" : ""}`}
        >
          <div className="flex items-center gap-2.5">
            <BookOpen size={16} className="text-[#063BAA]" />
            <div>
              <h2 className="text-sm font-geist font-medium text-[#0A1F4D] leading-tight">
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
            className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-[#0A1F4D] hover-tint transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div
        className={`flex-1 overflow-y-auto scrollbar-none ${isDesktopWeb ? "px-5 py-4 pb-16" : "px-5 py-4 pb-[130px]"}`}
      >
        <div
          className={
            isDesktopWeb
              ? "max-w-[calc(680px*var(--wx,1))] mx-auto space-y-3"
              : "space-y-3"
          }
        >
          <div className="bg-brand-gradient rounded-card p-6 text-white relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="relative space-y-1.5">
              <h3 className="text-base font-geist font-medium">
                New here? Start at the top.
              </h3>
              <p className="text-[11.5px] text-white leading-relaxed max-w-[560px]">
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
              <div key={s.id} className="glass-card rounded-card overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : s.id)}
                  aria-expanded={isOpen}
                  className={`w-full flex items-center gap-3.5 p-4.5 text-left transition-colors hover:bg-[#063BAA]/[0.05] ${
                    isOpen ? "border-b border-slate-50" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-nested bg-[#063BAA]/8 text-[#063BAA] flex items-center justify-center shrink-0">
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <span
                      className={`text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${LEVEL_TONE[s.level]}`}
                    >
                      {s.level}
                    </span>
                    <h3 className="text-[13px] font-medium text-[#0A1F4D] font-geist">
                      {s.title}
                    </h3>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen && (
                  <div className="p-4.5 space-y-4">
                    <p className="text-[11.5px] text-slate-500 leading-relaxed">
                      {s.summary}
                    </p>

                    <div className="space-y-3">
                      {s.steps.map((step, i) => (
                        <div key={step.title} className="flex gap-3">
                          <span className="w-5 h-5 rounded-full bg-[#063BAA]/8 text-[#063BAA] flex items-center justify-center text-[9px] font-medium shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-[12px] font-medium text-[#0A1F4D] font-geist">
                              {step.title}
                            </p>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              {step.body}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {s.tip && (
                      <div className="flex gap-2.5 bg-[#97edcc]/15 rounded-nested p-3.5">
                        <Lightbulb size={14} className="text-[#0A9E6E] shrink-0 mt-0.5" />
                        <p className="home-guide-tip text-[11px] text-slate-600 leading-relaxed">
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
