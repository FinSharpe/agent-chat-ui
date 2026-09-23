import { Skeleton } from "@/components/ui/skeleton";

/**
 * Stands in for a saved chat while its history loads: question bubbles on the
 * right, answer lines on the left, in the thread's own rhythm.
 */
export function ConversationSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-fade-in space-y-6"
    >
      <span className="sr-only">Loading conversation</span>
      {[0, 1].map((turn) => (
        <div
          key={turn}
          className="space-y-4"
        >
          <div className="flex justify-end">
            <Skeleton className="rounded-nested h-11 w-[55%] rounded-tr-xs" />
          </div>
          <div className="space-y-2.5">
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
            {turn === 0 && <Skeleton className="h-3.5 w-2/3" />}
          </div>
        </div>
      ))}
    </div>
  );
}
