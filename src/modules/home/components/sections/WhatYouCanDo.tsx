"use client";

import { ArrowRight } from "lucide-react";
import { ListRow, SectionLabel } from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { WHAT_YOU_CAN_DO } from "../../constants/features";
import type { ActionTarget } from "../../types/home.types";

const TONES = [
  { bg: "bg-[#063BAA]/8", fg: "text-[#063BAA]" },
  { bg: "bg-[#97edcc]/30", fg: "text-[#0A9E6E]" },
  { bg: "bg-[#0A1F4D]/8", fg: "text-[#0A1F4D]" },
];

/** Three orientation cards. Desktop: side-by-side cards, each with its own
 *  button. Mobile: cardless hairline rows — these are navigation, not data. */
export function WhatYouCanDo({
  onAction,
}: {
  onAction: (card: ActionTarget) => void;
}) {
  const isDesktopWeb = useIsDesktopWeb();

  return (
    <section className="space-y-2 select-none">
      <SectionLabel className="pl-1">What You Can Do</SectionLabel>
      {isDesktopWeb ? (
        <div className="grid grid-cols-3 gap-4">
          {WHAT_YOU_CAN_DO.map((c, idx) => {
            const Icon = c.icon;
            const tone = TONES[idx % TONES.length];
            return (
              <div
                key={c.title}
                className="glass-card card-hover rounded-card p-4 premium-shadow-sm flex flex-col gap-3"
              >
                {/* Icon beside the title keeps the card short without shrinking the icon. */}
                <div className="flex items-center gap-3">
                  <span
                    className={`w-10 h-10 rounded-tile ${tone.bg} ${tone.fg} flex items-center justify-center shrink-0`}
                  >
                    <Icon size={18} />
                  </span>
                  <h4 className="text-[13px] font-medium text-[#0A1F4D] font-geist leading-snug min-w-0">
                    {c.title}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug flex-1">
                  {c.desc}
                </p>
                <button
                  onClick={() => onAction(c)}
                  className="w-fit pl-4 pr-1 py-1 rounded-full text-[11.5px] font-medium flex items-center gap-2.5 bg-[#DFF9EF] text-[#0A1F4D] active:scale-95"
                >
                  {c.cta}
                  <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                    <ArrowRight size={12} className="text-[#0A1F4D]" />
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          {WHAT_YOU_CAN_DO.map((c, idx) => {
            const Icon = c.icon;
            return (
              <ListRow
                key={c.title}
                icon={<Icon size={18} />}
                title={c.title}
                sub={c.desc}
                tone={idx}
                onClick={() => onAction(c)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
