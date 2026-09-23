"use client";

import { ArrowLeft } from "lucide-react";

interface AuthScreenHeaderProps {
  title: string;
  onBack: () => void;
  /** Gap below the header; the reference varies it per screen. */
  className?: string;
}

/** Round back button, centred eyebrow title, and a spacer that balances it. */
export function AuthScreenHeader({
  title,
  onBack,
  className = "",
}: AuthScreenHeaderProps) {
  return (
    <div
      className={`relative z-10 flex shrink-0 items-center justify-between pt-4 ${className}`}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="hover-tint flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-[#0A1F4D] transition-colors"
      >
        <ArrowLeft size={16} />
      </button>
      <span className="text-xs font-medium tracking-wider text-[#0A1F4D] uppercase">
        {title}
      </span>
      <div className="w-8" />
    </div>
  );
}
