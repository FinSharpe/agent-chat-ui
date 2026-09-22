"use client";

import { ReactNode, useState } from "react";
import Image from "next/image";
import { CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PROMPT_CATEGORY,
  PROMPT_CATEGORIES,
  PROMPT_TONES,
} from "../constants/prompt-categories";

function Brand() {
  return (
    <div className="flex flex-col items-center text-center select-none">
      <div className="bg-brand-gradient mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-nested text-white shadow-md shadow-blue-900/10">
        <Image
          src="/logo/Finsharpe Logo - Icon - White.svg"
          alt="FinSharpeGPT"
          width={26}
          height={26}
          className="h-[26px] w-[26px]"
          priority
        />
      </div>
      <h3 className="font-geist mb-6 text-lg font-medium text-[#0A1F4D]">
        Consult FinSharpe<span className="text-[#063BAA]">GPT</span>
      </h3>
    </div>
  );
}

/** Category tabs over three starter prompts; a prompt is sent as typed. */
function StarterPrompts({
  desktop,
  onPrompt,
  disabled,
}: {
  desktop: boolean;
  onPrompt: (prompt: string) => void;
  disabled?: boolean;
}) {
  const [category, setCategory] = useState(DEFAULT_PROMPT_CATEGORY);

  return (
    <>
      <div className={cn("flex gap-2", desktop ? "mb-3" : "mb-4")}>
        {Object.keys(PROMPT_CATEGORIES).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={cn(
              "rounded-full font-medium transition-colors",
              desktop ? "px-4 py-2.5 text-[12px]" : "px-3.5 py-2 text-[11px]",
              category === cat
                ? "bg-[#063BAA] text-white"
                : "bg-[#063BAA]/6 text-slate-500 hover:text-[#063BAA]",
            )}
          >
            {cat}
          </button>
        ))}
      </div>
      <div
        className={cn(
          "w-full space-y-2 text-left",
          !desktop && "max-w-[340px]",
        )}
      >
        {PROMPT_CATEGORIES[category].map((prompt, i) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onPrompt(prompt)}
            className={cn(
              "glass-card hover-tint flex w-full items-center rounded-nested font-medium text-[#0A1F4D] transition-all disabled:cursor-not-allowed",
              desktop
                ? "gap-3 px-4 py-3.5 text-[13px]"
                : "gap-2.5 px-4 py-3 text-[11px]",
            )}
          >
            <CornerDownRight
              size={desktop ? 15 : 14}
              className={cn(
                "shrink-0 opacity-70",
                PROMPT_TONES[i % PROMPT_TONES.length],
              )}
            />
            <span className="leading-relaxed">{prompt}</span>
          </button>
        ))}
      </div>
    </>
  );
}

/**
 * A new chat, drawn like the reference. Desktop: one centred stack — brand,
 * the composer card, then the starter prompts across the column. Phone: brand
 * and prompts at the top of the page; the composer floats above the nav.
 */
export default function ChatEmptyState({
  desktop,
  composer,
  onPrompt,
  disabled,
}: {
  desktop: boolean;
  /** Desktop only: the composer card, placed between brand and prompts. */
  composer?: ReactNode;
  onPrompt: (prompt: string) => void;
  disabled?: boolean;
}) {
  if (desktop) {
    return (
      <div className="scrollbar-none flex h-full w-full flex-1 flex-col overflow-y-auto bg-transparent px-5 py-8">
        <div className="mx-auto my-auto flex w-full max-w-[calc(764px*var(--wx,1))] flex-col items-center">
          <Brand />
          {composer}
          <div className="mt-6 flex w-full flex-col items-center select-none">
            <StarterPrompts
              desktop
              onPrompt={onPrompt}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center text-center select-none">
      <Brand />
      <StarterPrompts
        desktop={false}
        onPrompt={onPrompt}
        disabled={disabled}
      />
    </div>
  );
}
