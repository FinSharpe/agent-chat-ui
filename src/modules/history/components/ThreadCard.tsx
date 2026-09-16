import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Thread } from "@langchain/langgraph-sdk";
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  MessageSquare,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useThreadMetadataMutation } from "../hooks/useThreadMetadataMutation";
import { getUserTitle, isBookmarked } from "../utils/threadMetadata";
import { getThreadInfo } from "../utils/threadUtils";
import ThreadTitleInput from "./ThreadTitleInput";

interface ThreadCardProps {
  thread: Thread;
  /** Render against the dark navy navigation drawer instead of a light page. */
  dark?: boolean;
}

export default function ThreadCard({ thread, dark = false }: ThreadCardProps) {
  const { title, derivedTitle, preview, messageCount, timestamp } =
    getThreadInfo(thread);
  const bookmarked = isBookmarked(thread);
  const { setBookmarked, setTitle } = useThreadMetadataMutation();
  const [isRenaming, setIsRenaming] = useState(false);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarked(thread.thread_id, !bookmarked);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRenaming(true);
  };

  const commitTitle = (value: string) => {
    setIsRenaming(false);
    // Typing the first message's title back is the same as clearing the rename.
    const next = value.trim() === derivedTitle ? "" : value.trim();
    if (next !== (getUserTitle(thread) ?? "")) setTitle(thread.thread_id, next);
  };

  const card = (
    <Card
      className={cn(
        "group flex h-full flex-col justify-between overflow-hidden transition-all",
        !isRenaming && "cursor-pointer",
        dark
          ? "rounded-xl border-white/[0.08] bg-white/[0.04] p-3 shadow-none hover:border-white/15 hover:bg-white/[0.07]"
          : "border-gray-200 p-4 hover:shadow-md",
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex min-w-0 items-center gap-2">
            {isRenaming ? (
              <ThreadTitleInput
                initialValue={title}
                placeholder={derivedTitle}
                dark={dark}
                onCommit={commitTitle}
                onCancel={() => setIsRenaming(false)}
              />
            ) : (
              <h3
                className={cn(
                  "min-w-0 truncate font-medium",
                  dark ? "text-white/90" : "text-gray-900",
                )}
              >
                {title}
              </h3>
            )}
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
        <div className="flex flex-shrink-0 items-center gap-1">
          {!isRenaming && (
            <button
              className={cn(
                "rounded-full p-1 transition-[color,background-color,opacity] focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100",
                dark
                  ? "text-white/30 hover:bg-white/10 hover:text-white/70"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
              )}
              title="Rename"
              aria-label="Rename chat"
              onClick={handleRename}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            className={cn(
              "rounded-full p-1 transition-colors",
              dark ? "hover:bg-white/10" : "hover:bg-gray-100",
            )}
            title={bookmarked ? "Remove Bookmark" : "Bookmark"}
            aria-pressed={bookmarked}
            onClick={handleBookmark}
          >
            {bookmarked ? (
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
  );

  // While renaming, the card is not a link: a click in the field must not navigate.
  if (isRenaming) return <div className="block h-full">{card}</div>;

  return (
    <Link
      href={`/?threadId=${thread.thread_id}`}
      className="block h-full"
    >
      {card}
    </Link>
  );
}
