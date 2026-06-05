import { Input } from "@/components/ui/input";
import { useThreadsQuery } from "@/hooks/useThreadsQuery";
import { cn } from "@/lib/utils";
import { Thread } from "@langchain/langgraph-sdk";
import {
  isThisMonth,
  isThisWeek,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";
import { Search } from "lucide-react";
import { useState } from "react";
import { getThreadInfo } from "../utils/threadUtils";
import ThreadGroupSection from "./ThreadGroupSection";
import ThreadHistoryLoading from "./ThreadHistoryLoading";

export default function ThreadHistoryList({
  compact = false,
  dark = false,
  className,
}: {
  compact?: boolean;
  /** Render against the dark navy navigation drawer instead of a light page. */
  dark?: boolean;
  className?: string;
}) {
  const { data: threads, isLoading } = useThreadsQuery();
  const [searchQuery, setSearchQuery] = useState("");

  const mutedText = dark ? "text-white/45" : "text-muted-foreground";

  if (isLoading) {
    return (
      <ThreadHistoryLoading
        compact={compact}
        dark={dark}
      />
    );
  }

  if (!threads || threads.length === 0) {
    return (
      <div className={cn("mt-8 text-center text-sm", mutedText)}>
        No conversation history found.
      </div>
    );
  }

  const filteredThreads = threads.filter((thread) => {
    if (!searchQuery) return true;
    const { title, preview } = getThreadInfo(thread);
    const query = searchQuery.toLowerCase();
    return (
      title.toLowerCase().includes(query) ||
      preview.toLowerCase().includes(query)
    );
  });

  // Group threads by date
  const groups: Record<string, Thread[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    "This Month": [],
    Older: [],
  };

  filteredThreads.forEach((thread) => {
    if (!thread.created_at) {
      groups.Older.push(thread);
      return;
    }
    const date = parseISO(thread.created_at);
    if (isToday(date)) {
      groups.Today.push(thread);
    } else if (isYesterday(date)) {
      groups.Yesterday.push(thread);
    } else if (isThisWeek(date)) {
      groups["This Week"].push(thread);
    } else if (isThisMonth(date)) {
      groups["This Month"].push(thread);
    } else {
      groups.Older.push(thread);
    }
  });

  return (
    <div className={compact ? "flex h-full min-h-0 flex-col gap-4" : "space-y-6"}>
      {/* Search */}
      <div className="relative shrink-0">
        <Search
          className={cn(
            "absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform",
            dark ? "text-white/40" : "text-gray-400",
          )}
        />
        <Input
          placeholder="Search your chats..."
          className={cn(
            "rounded-lg pl-10",
            dark
              ? "border-white/10 bg-white/[0.06] text-white placeholder:text-white/40 focus-visible:border-blue-400/60 focus-visible:ring-2 focus-visible:ring-blue-400/20"
              : "border-gray-200 focus:border-blue-500",
          )}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredThreads.length === 0 ? (
        <div className={cn("mt-8 text-center text-sm", mutedText)}>
          No threads found matching "{searchQuery}".
        </div>
      ) : (
        <div className={className}>
          <ThreadGroupSection
            title="Today"
            threads={groups.Today}
            compact={compact}
            dark={dark}
          />
          <ThreadGroupSection
            title="Yesterday"
            threads={groups.Yesterday}
            compact={compact}
            dark={dark}
          />
          <ThreadGroupSection
            title="This Week"
            threads={groups["This Week"]}
            compact={compact}
            dark={dark}
          />
          <ThreadGroupSection
            title="This Month"
            threads={groups["This Month"]}
            compact={compact}
            dark={dark}
          />
          <ThreadGroupSection
            title="Older"
            threads={groups.Older}
            compact={compact}
            dark={dark}
          />
        </div>
      )}
    </div>
  );
}
