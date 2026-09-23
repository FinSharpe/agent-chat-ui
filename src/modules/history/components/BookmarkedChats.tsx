import { Bookmark } from "lucide-react";
import { MEMORY_COPY } from "../constants/memory-content";
import type { ChatSummary } from "../hooks/useChatHistory";
import ChatRow from "./ChatRow";
import ChatRowsSkeleton from "./ChatRowsSkeleton";

interface BookmarkedChatsProps {
  chats: ChatSummary[];
  isLoading: boolean;
  /** The list failed to load: say so rather than invite a first bookmark. */
  isError: boolean;
  onOpen: (chat: ChatSummary) => void;
  onRename: (chat: ChatSummary, value: string) => void;
  onToggleBookmark: (chat: ChatSummary) => void;
}

/**
 * Bookmarked Chats, straight under the memory banner since these are the
 * chats meant to be quickest to get back to: hairline rows holding just the
 * titles, scrolling within themselves once there are more than a few.
 */
export default function BookmarkedChats({
  chats,
  isLoading,
  isError,
  ...rowHandlers
}: BookmarkedChatsProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-1.5 px-1">
        <Bookmark
          size={13}
          className="text-[#063BAA]"
        />
        <h3 className="text-xs font-medium tracking-wider text-black uppercase dark:text-white">
          {MEMORY_COPY.bookmarkedHeading}
        </h3>
      </div>

      {isLoading ? (
        <ChatRowsSkeleton variant="bookmarked" />
      ) : chats.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-400">
          {isError ? MEMORY_COPY.loadFailed : MEMORY_COPY.noBookmarks}
        </p>
      ) : (
        // The 4px side gutter holds the icon buttons' enlarged tap targets;
        // without it they overflow this scroller, and focusing one scrolls
        // the whole list sideways.
        <div className="scrollbar-none -mx-1 max-h-[280px] divide-y divide-slate-100 overflow-y-auto px-1 dark:divide-slate-800/60">
          {chats.map((chat) => (
            <ChatRow
              key={chat.id}
              chat={chat}
              variant="bookmarked"
              {...rowHandlers}
            />
          ))}
        </div>
      )}
    </section>
  );
}
