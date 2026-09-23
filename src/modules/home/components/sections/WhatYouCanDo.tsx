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
                className="glass-card card-hover rounded-card premium-shadow-sm flex flex-col gap-3 p-4"
              >
                {/* Icon beside the title keeps the card short without shrinking the icon. */}
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-tile h-10 w-10 ${tone.bg} ${tone.fg} flex shrink-0 items-center justify-center`}
                  >
                    <Icon size={18} />
                  </span>
                  <h4 className="font-geist min-w-0 text-[13px] leading-snug font-medium text-[#0A1F4D]">
                    {c.title}
                  </h4>
                </div>
                <p className="flex-1 text-[11px] leading-snug text-slate-500">
                  {c.desc}
                </p>
                <button
                  onClick={() => onAction(c)}
                  className="flex w-fit items-center gap-2.5 rounded-full bg-[#DFF9EF] py-1 pr-1 pl-4 text-[11.5px] font-medium text-[#0A1F4D] active:scale-95"
                >
                  {c.cta}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white">
                    <ArrowRight
                      size={12}
                      className="text-[#0A1F4D]"
                    />
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
