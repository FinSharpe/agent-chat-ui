import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/** Single KPI-tile placeholder matching StatTile's footprint. */
export function StatTileSkeleton() {
  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-28" />
    </div>
  );
}

/** Row of KPI placeholders — mirrors the populated stat grid so the layout
 * doesn't jump when data lands. */
export function StatTileGridSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <StatTileSkeleton key={i} />
      ))}
    </div>
  );
}

/** Bordered panel with placeholder rows — stands in for a loading data table. */
export function TableSkeleton({
  rows = 6,
  label,
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="border-border-subtle bg-bg-subtle/60 flex items-center border-b px-4 py-2.5">
        <Skeleton className="h-3 w-32" />
        {label && <span className="sr-only">{label}</span>}
      </div>
      <div className="divide-border-subtle divide-y">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="flex items-center gap-3 px-4 py-3"
          >
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-24 sm:block" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-6 w-6 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Generic stacked-card placeholder list (bank cards, SIP rows, etc.). */
export function CardListSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}
