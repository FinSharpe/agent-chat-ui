import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Thread } from "@langchain/langgraph-sdk";
import { Bookmark, BookmarkCheck, Clock, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { BookmarkManager } from "../utils/BookmarkManager";
import { getThreadInfo } from "../utils/threadUtils";

interface ThreadCardProps {
  thread: Thread;
  /** Render against the dark navy navigation drawer instead of a light page. */
  dark?: boolean;
}

export default function ThreadCard({ thread, dark = false }: ThreadCardProps) {
  const { title, preview, messageCount, timestamp } = getThreadInfo(thread);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const updateState = () => {
      setIsBookmarked(BookmarkManager.isBookmarked(thread.thread_id));
    };

    updateState();
    window.addEventListener("bookmarks-updated", updateState);
    return () => window.removeEventListener("bookmarks-updated", updateState);
  }, [thread.thread_id]);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = BookmarkManager.toggleBookmark(thread.thread_id);
    setIsBookmarked(newState);
  };

  return (
    <Link
      href={`/?threadId=${thread.thread_id}`}
      className="block h-full"
    >
      <Card
        className={cn(
          "flex h-full cursor-pointer flex-col justify-between overflow-hidden transition-all",
          dark
            ? "rounded-xl border-white/[0.08] bg-white/[0.04] p-3 shadow-none hover:border-white/15 hover:bg-white/[0.07]"
            : "border-gray-200 p-4 hover:shadow-md",
        )}
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex min-w-0 items-center gap-2">
              <h3
                className={cn(
                  "min-w-0 truncate font-medium",
                  dark ? "text-white/90" : "text-gray-900",
                )}
              >
                {title}
              </h3>
            </div>
            <p
              className={cn(
                "mb-2 line-clamp-2 text-sm break-words",
                dark ? "text-white/45" : "text-gray-600",
              )}
            >
              {preview}
            </p>
            <div
              className={cn(
                "flex flex-wrap items-center gap-4 text-xs",
                dark ? "text-white/35" : "text-gray-500",
              )}
            >
              {timestamp && (
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span>{timestamp}</span>
                </div>
              )}
              <div className="flex items-center gap-1 whitespace-nowrap">
                <MessageSquare className="h-3 w-3 flex-shrink-0" />
                <span>{messageCount} messages</span>
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              className={cn(
                "rounded-full p-1 transition-colors",
                dark ? "hover:bg-white/10" : "hover:bg-gray-100",
              )}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
              onClick={handleBookmark}
            >
              {isBookmarked ? (
                <BookmarkCheck
                  className={cn(
                    "h-4 w-4",
                    dark ? "text-amber-300" : "text-yellow-500",
                  )}
                />
              ) : (
                <Bookmark
                  className={cn(
                    "h-4 w-4",
                    dark
                      ? "text-white/30 hover:text-amber-300"
                      : "text-gray-400 hover:text-yellow-500",
                  )}
                />
              )}
            </button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
