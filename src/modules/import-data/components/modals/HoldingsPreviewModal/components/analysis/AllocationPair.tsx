"use client";
import {
  DonutBreakdown,
  type DonutSegment,
} from "@/modules/import-data/components/shared/ui";

/** One half-width allocation card (reference "Sectors" / "Market Cap"). */
function HalfCard({
  label,
  segments,
}: {
  label: string;
  segments: DonutSegment[];
}) {
  return (
    <div className="glass-card rounded-card flex min-h-[160px] min-w-0 flex-col justify-between p-4">
      <span className="mb-2 block text-[9px] font-medium tracking-wider text-slate-400 uppercase">
        {label}
      </span>
      <DonutBreakdown
        size="sm"
        segments={segments}
        max={5}
      />
    </div>
  );
}

/** Two allocation donuts side by side, as in the reference equity analysis. */
export function AllocationPair({
  left,
  right,
}: {
  left: { label: string; segments: DonutSegment[] };
  right: { label: string; segments: DonutSegment[] };
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <HalfCard {...left} />
      <HalfCard {...right} />
    </div>
  );
}
