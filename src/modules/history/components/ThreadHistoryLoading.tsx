import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ThreadHistoryLoading({
  compact = false,
  dark = false,
}: {
  compact?: boolean;
  dark?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={`skeleton-${i}`}
            className={cn("h-16 w-full rounded-xl", dark && "bg-white/10")}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
          key={`skeleton-${i}`}
          className={cn("h-32 w-full", dark && "bg-white/10")}
        />
      ))}
    </div>
  );
}
