"use client";

import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Card chrome shared by the in-chat stock, fund and portfolio analyses, in
 * the reference's language (StockAnalysisCard): white glass cards, navy
 * type, 500-weight headings. Chat-only — the PDF templates render these
 * analyses with their own components.
 */

export function AnalysisCard({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "glass-card rounded-card w-full space-y-4 p-5",
        // Each markdown section ends in a rule; the card's own edge replaces
        // the last one.
        "[&>*:last-child_hr:last-child]:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A card's own title row, for cards whose title is not in the markdown. */
export function AnalysisCardTitle({ children }: { children: ReactNode }) {
  return (
    <h4 className="font-geist text-sm font-medium text-[#0A1F4D]">
      {children}
    </h4>
  );
}

/** A nested panel inside an analysis card (score gauges, charts). */
export function AnalysisPanel({
  title,
  children,
  className,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-nested overflow-hidden border border-slate-100 bg-white",
        className,
      )}
    >
      {title && (
        <div className="px-4 pt-3.5">
          <span className="text-[9px] font-medium tracking-wider text-slate-400 uppercase">
            {title}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

/** "Back to top" pill, paired with the report download in the footer. */
export function BackToTopButton({
  onClick,
  label = "Back to top",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#DFF9EF] px-4 text-[12px] font-medium text-[#0A1F4D] transition-colors"
    >
      <ArrowUp size={14} />
      {label}
    </button>
  );
}
