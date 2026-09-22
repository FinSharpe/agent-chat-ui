import { cn } from "@/lib/utils";

const TITLE_WIDTHS = ["w-2/5", "w-1/2", "w-1/3", "w-[45%]"];

/**
 * Placeholder rows while the chat list loads — the same row geometry as
 * ChatRow, with the pulsing slate bars the reference's loaders use.
 */
export default function ChatRowsSkeleton({
  rows = 3,
  variant,
}: {
  rows?: number;
  variant: "bookmarked" | "history";
}) {
  const isBookmarkedRow = variant === "bookmarked";

  return (
    <div
      aria-hidden="true"
      className={cn(
        isBookmarkedRow && "divide-y divide-slate-100 dark:divide-slate-800/60",
      )}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex w-full items-center justify-between gap-2",
            isBookmarkedRow ? "py-3.5" : "border-b border-slate-200 py-3",
          )}
        >
          {/* A bar the height of one 13px title line, so rows don't jump when
              the real titles arrive. */}
          <div className="flex h-[1.5em] min-w-0 flex-1 items-center text-[13px]">
            <div
              className={cn(
                "h-3.5 animate-pulse rounded-md bg-slate-100",
                TITLE_WIDTHS[i % TITLE_WIDTHS.length],
              )}
            />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="h-3.5 w-3.5 animate-pulse rounded-sm bg-slate-100" />
            <div className="h-3.5 w-3.5 animate-pulse rounded-sm bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
