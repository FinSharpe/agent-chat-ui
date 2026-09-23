import { cn } from "@/lib/utils";
import { Bookmark, Pencil } from "lucide-react";
import { useState } from "react";
import type { ChatSummary } from "../hooks/useChatHistory";
import ThreadTitleInput from "./ThreadTitleInput";

interface ChatRowProps {
  chat: ChatSummary;
  /**
   * "bookmarked": the roomier rows of the Bookmarked Chats list, which sit
   * between the list's own dividers. "history": the Chat History rows, each
   * closed by its own hairline.
   */
  variant: "bookmarked" | "history";
  onOpen: (chat: ChatSummary) => void;
  onRename: (chat: ChatSummary, value: string) => void;
  onToggleBookmark: (chat: ChatSummary) => void;
}

// The icons are drawn at the reference's 13–14px; the padding (cancelled by
// the negative margin, so the row's spacing is unchanged) gives them a
// usable tap target.
const ICON_BUTTON =
  "-m-1 flex items-center justify-center rounded-full p-1 transition-colors";

/** A cardless Memory row: the chat's title, then rename and bookmark. */
export default function ChatRow({
  chat,
  variant,
  onOpen,
  onRename,
  onToggleBookmark,
}: ChatRowProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const isBookmarkedRow = variant === "bookmarked";
  const iconSize = isBookmarkedRow ? 14 : 13;

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-2",
        isBookmarkedRow
          ? "py-3.5"
          : "border-b border-slate-200 py-3 transition-colors active:bg-[#063BAA]/[0.03]",
      )}
    >
      {isRenaming ? (
        <ThreadTitleInput
          initialValue={chat.title}
          placeholder={chat.derivedTitle}
          onCommit={(value) => {
            setIsRenaming(false);
            onRename(chat, value);
          }}
          onCancel={() => setIsRenaming(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => onOpen(chat)}
          className="min-w-0 flex-1 cursor-pointer text-left"
        >
          <h4 className="font-geist truncate text-[13px] font-medium text-[#0A1F4D]">
            {chat.title}
          </h4>
        </button>
      )}

      <div className="flex shrink-0 items-center gap-3">
        {!isRenaming && (
          <button
            type="button"
            aria-label="Rename chat"
            title="Rename"
            onClick={() => setIsRenaming(true)}
            className={cn(
              ICON_BUTTON,
              isBookmarkedRow
                ? "text-[#0A1F4D]/45 hover:text-[#0A1F4D]/70 dark:text-white/45 dark:hover:text-white/70"
                : "text-slate-300 hover:text-slate-400",
            )}
          >
            <Pencil size={iconSize} />
          </button>
        )}
        <button
          type="button"
          aria-label={chat.bookmarked ? "Remove bookmark" : "Bookmark chat"}
          aria-pressed={chat.bookmarked}
          title={chat.bookmarked ? "Remove bookmark" : "Bookmark"}
          onClick={() => onToggleBookmark(chat)}
          className={cn(
            ICON_BUTTON,
            chat.bookmarked
              ? "text-[#063BAA]"
              : "text-slate-300 hover:text-[#063BAA]",
          )}
        >
          <Bookmark
            size={iconSize}
            fill={chat.bookmarked ? "currentColor" : "none"}
          />
        </button>
      </div>
    </div>
  );
}
