import { useThreadsQuery } from "@/hooks/useThreadsQuery";
import { useMemo } from "react";
import { selectBookmarkedThreads } from "../utils/threadMetadata";
import {
  ChatSummary,
  groupChats,
  TIME_GROUPS,
  TimeGroup,
  useChatHistory,
} from "./useChatHistory";

export interface ChatGroup {
  group: TimeGroup;
  chats: ChatSummary[];
}

/**
 * The Memory page's view of the chat history: the bookmarked chats (newest
 * bookmark first, the order the phone shows them in) and the searched
 * history split into its non-empty time groups.
 */
export function useMemoryChats(query: string) {
  const { chats, isLoading, renameChat, toggleBookmark } = useChatHistory();
  // Same query key as useChatHistory's, so this shares its cache and request;
  // it is read here only for the failure state that hook does not expose.
  const { isError, refetch } = useThreadsQuery();

  const bookmarked = useMemo(() => {
    const byId = new Map(chats.map((c) => [c.id, c]));
    return selectBookmarkedThreads(chats.map((c) => c.thread)).flatMap((t) => {
      const chat = byId.get(t.thread_id);
      return chat ? [chat] : [];
    });
  }, [chats]);

  const groups = useMemo<ChatGroup[]>(() => {
    const { groups: byGroup } = groupChats(chats, query);
    return TIME_GROUPS.map((group) => ({
      group,
      chats: byGroup[group],
    })).filter((g) => g.chats.length > 0);
  }, [chats, query]);

  return {
    bookmarked,
    groups,
    hasChats: chats.length > 0,
    isLoading,
    isError: isError && chats.length === 0,
    retry: () => void refetch(),
    renameChat,
    toggleBookmark,
  };
}
