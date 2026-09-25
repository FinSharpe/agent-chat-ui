"use client";

import { ArrowRight } from "lucide-react";

/**
 * "See all →" at the end of a section head — finsharpe-mobile's `SeeAllLink`
 * (#174): interactive blue at 11.5/500 with a 12 arrow, on a 44-tall target
 * that reaches 16 to the left of the words. The negative block margin keeps
 * the target from pushing the head's label down.
 */
export function SeeAllLink({
  label,
  onClick,
}: {
  /** What a screen reader hears: what there is all of ("See all market news"). */
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-tile -my-3 flex h-11 shrink-0 items-center gap-1 pl-4 text-[11.5px] leading-[1.2] font-medium text-[#063BAA] hover:underline dark:text-[#8FB4FF]"
    >
      See all <ArrowRight size={12} />
    </button>
  );
}
