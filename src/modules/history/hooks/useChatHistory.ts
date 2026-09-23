import { useThreadsQuery } from "@/hooks/useThreadsQuery";
import { Thread } from "@langchain/langgraph-sdk";
import { isThisWeek, isToday, isYesterday, parseISO } from "date-fns";
import { useCallback, useMemo } from "react";
import { getUserTitle, isBookmarked } from "../utils/threadMetadata";
import { getThreadInfo } from "../utils/threadUtils";
import { useDeleteThreadMutation } from "./useDeleteThreadMutation";
import { useLegacyBookmarkMigration } from "./useLegacyBookmarkMigration";
import { useThreadMetadataMutation } from "./useThreadMetadataMutation";

export type TimeGroup = "Today" | "Yesterday" | "This Week" | "Older";
export const TIME_GROUPS: TimeGroup[] = [
  "Today",
  "Yesterday",
  "This Week",
  "Older",
];

/** A chat as the shell's history lists show it. */
export interface ChatSummary {
  id: string;
  title: string;
  /** The title the first message gives it, before any rename. */
  derivedTitle: string;
  preview: string;
  messageCount: number;
  timestamp: string;
  timeGroup: TimeGroup;
  bookmarked: boolean;
  thread: Thread;
}

function timeGroupOf(thread: Thread): TimeGroup {
  if (!thread.created_at) return "Older";
  const date = parseISO(thread.created_at);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date)) return "This Week";
  return "Older";
}

export function toChatSummary(thread: Thread): ChatSummary {
  const { title, derivedTitle, preview, messageCount, timestamp } =
    getThreadInfo(thread);
  return {
    id: thread.thread_id,
    title,
    derivedTitle,
    preview,
    messageCount,
    timestamp,
    timeGroup: timeGroupOf(thread),
    bookmarked: isBookmarked(thread),
    thread,
  };
}

/**
 * The signed-in user's chats, grouped Today / Yesterday / This Week / Older
 * like the reference history lists, with rename, bookmark and delete.
 */
export function useChatHistory() {
  const { data: threads, isLoading } = useThreadsQuery();
  useLegacyBookmarkMigration(threads);
  const { setTitle, setBookmarked } = useThreadMetadataMutation();
  const deleteMutation = useDeleteThreadMutation();

  const chats = useMemo(() => (threads ?? []).map(toChatSummary), [threads]);

  /** Renames a chat; typing the first message's title back clears the rename. */
  const renameChat = useCallback(
    (chat: ChatSummary, value: string) => {
      const next = value.trim() === chat.derivedTitle ? "" : value.trim();
      if (next !== (getUserTitle(chat.thread) ?? "")) setTitle(chat.id, next);
    },
    [setTitle],
  );

  const toggleBookmark = useCallback(
    (chat: ChatSummary) => setBookmarked(chat.id, !chat.bookmarked),
    [setBookmarked],
  );

  const deleteChat = useCallback(
    (id: string) => deleteMutation.mutate(id),
    [deleteMutation],
  );

  return { chats, isLoading, renameChat, toggleBookmark, deleteChat };
}

/** Chats matching a search, split into the four time groups. */
export function groupChats(chats: ChatSummary[], query = "") {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? chats.filter((c) =>
        [c.title, c.derivedTitle, c.preview].some((t) =>
          t.toLowerCase().includes(q),
        ),
      )
    : chats;
  const groups = Object.fromEntries(
    TIME_GROUPS.map((g) => [g, filtered.filter((c) => c.timeGroup === g)]),
  ) as Record<TimeGroup, ChatSummary[]>;
  return { filtered, groups };
}
