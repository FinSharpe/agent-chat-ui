"use client";

import { useState } from "react";
import { Check, ChevronDown, Layers } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getModelTier, MODEL_TIERS } from "@/configs/models";
import { cn } from "@/lib/utils";
import { useChatPrefsStore } from "../store/useChatPrefsStore";

/**
 * The composer's model pill and its popover, drawn like the reference
 * ModelPicker. The reference toggles several models; the app runs one tier
 * per message, so this is a single choice — picking a tier closes the list.
 *
 * `compact` is the phone pill: smaller, next to the mic.
 */
export default function ModelPicker({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const model = useChatPrefsStore((s) => s.model);
  const setModel = useChatPrefsStore((s) => s.setModel);
  const selected = getModelTier(model);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Model"
          className={cn(
            "flex shrink-0 items-center rounded-full bg-[#DFF9EF] font-medium text-[#0A1F4D] transition-colors",
            compact
              ? "h-8 gap-1 pr-2.5 pl-2 text-[11px]"
              : "h-9 gap-1.5 pr-3 pl-3.5 text-[12px]",
          )}
        >
          <Layers size={13} />
          <span className="max-w-[220px] truncate">{selected.label}</span>
          {/* The phone bar is tight: the tier name matters more than the
              caret, and the pill still reads as a control. */}
          {!compact && (
            <ChevronDown
              size={12}
              className={cn("transition-transform", open && "rotate-180")}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={10}
        collisionPadding={12}
        className="w-64 space-y-3 rounded-nested border-slate-100 bg-white p-3.5 text-[#0A1F4D] shadow-[0_10px_30px_rgba(10,31,77,0.12)]"
      >
        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
          <span className="font-geist text-[11px] font-medium text-[#0A1F4D]">
            AI Model
          </span>
          <span className="text-[9px] font-medium text-slate-400">
            {selected.label} selected
          </span>
        </div>
        <div className="space-y-1">
          <span className="block px-1.5 text-[8px] font-medium tracking-wider text-slate-400 uppercase">
            Effort
          </span>
          {MODEL_TIERS.map((tier) => {
            const isOn = tier.model === model;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => {
                  setModel(tier.model);
                  setOpen(false);
                }}
                className="hover-tint flex w-full items-center justify-between gap-3 rounded-tile px-1.5 py-1.5 text-left transition-colors"
              >
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-[11px]",
                      isOn ? "font-medium text-[#0A1F4D]" : "text-slate-500",
                    )}
                  >
                    {tier.label}
                  </span>
                  <span className="block text-[9px] leading-snug text-slate-400">
                    {tier.description}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all",
                    isOn
                      ? "bg-[#063BAA] text-white"
                      : "border border-slate-200 dark:border-slate-700",
                  )}
                >
                  {isOn && (
                    <Check
                      size={10}
                      strokeWidth={3.5}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
