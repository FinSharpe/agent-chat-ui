"use client";

import type { Thread } from "@langchain/langgraph-sdk";
import { useMemo } from "react";

import { useThreadsQuery } from "@/hooks/useThreadsQuery";
import { getThreadInfo } from "@/modules/history/utils/threadUtils";

/**
 * thread id → the title the sidebar shows for it, from the thread list this
 * browser already holds (#223 §4: the client titles chat rows, because the
 * title is user-edited thread state and a server join would cost a runtime
 * call per row). A thread that is not in the list is simply absent, and its
 * row reads "Chat".
 */
export function threadTitleMap(threads: readonly Thread[] | undefined) {
  const titles = new Map<string, string>();
  for (const thread of threads ?? []) {
    const { title } = getThreadInfo(thread);
    // A thread with no messages yet is "titled" by its own id; that is not
    // a title a reader should see.
    if (title && title !== thread.thread_id) {
      titles.set(thread.thread_id, title);
    }
  }
  return titles;
}

export function useThreadTitles(): ReadonlyMap<string, string> {
  const { data } = useThreadsQuery();
  return useMemo(() => threadTitleMap(data), [data]);
}
