import { cn } from "@/lib/utils";
import { Thread } from "@langchain/langgraph-sdk";
import { Calendar } from "lucide-react";
import ThreadCard from "./ThreadCard";

export default function ThreadGroupSection({
  title,
  threads,
  compact = false,
  dark = false,
}: {
  title: string;
  threads: Thread[];
  compact?: boolean;
  dark?: boolean;
}) {
  if (threads.length === 0) return null;

  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-3 flex items-center gap-2">
        <Calendar
          className={cn(
            "h-4 w-4 flex-shrink-0",
            dark ? "text-blue-300/70" : "text-gray-500",
          )}
        />
        <h3
          className={cn(
            dark
              ? "text-xs font-semibold tracking-wider text-white/45 uppercase"
              : "font-medium text-gray-900",
          )}
        >
          {title}
        </h3>
      </div>
      <div
        className={
          compact
            ? "flex flex-col gap-2"
            : "grid w-full grid-cols-1 gap-3 md:grid-cols-2"
        }
      >
        {threads.map((t) => (
          <ThreadCard
            key={t.thread_id}
            thread={t}
            dark={dark}
          />
        ))}
      </div>
    </div>
  );
}
