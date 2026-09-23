import { cn } from "@/lib/utils";

/** One pulsing placeholder bar in the reference neutral tint. */
export function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-full bg-slate-100 dark:bg-slate-800",
        className,
      )}
    />
  );
}

/** Placeholder matching a StatTile's footprint. */
export function StatTileSkeleton() {
  return (
    <div className="glass-card rounded-nested flex flex-col items-center gap-1.5 p-3">
      <Bone className="h-2.5 w-14" />
      <Bone className="h-4 w-16" />
      <Bone className="h-2 w-12" />
    </div>
  );
}

/** A row of stat-tile placeholders, so the layout doesn't jump when data lands. */
export function StatTileGridSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        count === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <StatTileSkeleton key={i} />
      ))}
    </div>
  );
}

/** Card with an eyebrow and placeholder rows — stands in for a table/list. */
export function TableSkeleton({
  rows = 6,
  label,
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div className="glass-card rounded-card space-y-4 p-5">
      <Bone className="h-2.5 w-24" />
      {label && <span className="sr-only">{label}</span>}
      <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="flex items-center gap-3 py-2.5"
          >
            <div className="flex-1 space-y-1.5">
              <Bone className="h-3 w-2/5" />
              <Bone className="h-2 w-1/4" />
            </div>
            <Bone className="h-3 w-12" />
            <Bone className="h-3 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Stacked row placeholders inside one card (accounts, SIP folios…). */
export function CardListSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("glass-card rounded-card space-y-3 p-5", className)}>
      <Bone className="h-2.5 w-20" />
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-1"
        >
          <div className="rounded-tile h-10 w-10 shrink-0 animate-pulse bg-slate-100 dark:bg-slate-800" />
          <div className="flex-1 space-y-1.5">
            <Bone className="h-3 w-1/3" />
            <Bone className="h-2 w-1/5" />
          </div>
          <Bone className="h-3 w-14" />
        </div>
      ))}
    </div>
  );
}

/** Placeholder for a chart card. */
export function ChartSkeleton({ height = 120 }: { height?: number }) {
  return (
    <div className="glass-card rounded-card space-y-3 p-5">
      <Bone className="h-2.5 w-28" />
      <div
        className="rounded-nested w-full animate-pulse bg-slate-50 dark:bg-slate-800/40"
        style={{ height }}
      />
    </div>
  );
}
