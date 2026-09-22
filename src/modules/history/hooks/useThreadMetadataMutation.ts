import { useApiUrl } from "@/hooks/useDefaultApiValues";
import { getApiKey } from "@/lib/api-key";
import { createClient } from "@/providers/client";
import { Thread } from "@langchain/langgraph-sdk";
import {
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import {
  bookmarkPatch,
  ThreadMetadataPatch,
  titlePatch,
} from "../utils/threadMetadata";

interface ThreadMetadataVariables {
  threadId: string;
  metadata: ThreadMetadataPatch;
  /** Skip the failure toast; the caller reports the outcome itself. */
  silent?: boolean;
}

/** Every cached thread list, whichever API URL or assistant it was fetched for. */
const THREADS_QUERY_FILTER = { queryKey: ["threads"] };

function patchCachedThread(
  queryClient: QueryClient,
  threadId: string,
  patch: (metadata: Thread["metadata"]) => Thread["metadata"],
) {
  queryClient.setQueriesData<Thread[]>(THREADS_QUERY_FILTER, (threads) =>
    threads?.map((t) =>
      t.thread_id === threadId ? { ...t, metadata: patch(t.metadata) } : t,
    ),
  );
}

function findCachedThread(queryClient: QueryClient, threadId: string) {
  for (const [, threads] of queryClient.getQueriesData<Thread[]>(
    THREADS_QUERY_FILTER,
  )) {
    const thread = threads?.find((t) => t.thread_id === threadId);
    if (thread) return thread;
  }
  return undefined;
}

/**
 * Writes the shared thread-metadata keys (bookmark, title) optimistically:
 * the cached row changes before the request goes out, and nothing re-fetches
 * on success — the patched row already is the server's view. A refused write
 * puts back only the keys it changed, and only where nothing newer has
 * replaced them since.
 */
export function useThreadMetadataMutation() {
  const [apiUrl] = useApiUrl();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    // Writes run one at a time, in the order they were made. The server merges
    // metadata, so two quick edits to one chat (rename, then clear) sent in
    // parallel could land in the wrong order and keep the stale value.
    scope: { id: "thread-metadata" },
    mutationFn: async ({ threadId, metadata }: ThreadMetadataVariables) => {
      const client = createClient(apiUrl, getApiKey() ?? undefined);
      return client.threads.update(threadId, { metadata });
    },
    onMutate: async ({ threadId, metadata }) => {
      // An in-flight list fetch would land after the patch and undo it.
      await queryClient.cancelQueries(THREADS_QUERY_FILTER);
      const previous = findCachedThread(queryClient, threadId)?.metadata ?? {};
      patchCachedThread(queryClient, threadId, (current) => ({
        ...current,
        ...metadata,
      }));
      return { previous };
    },
    onError: (_error, { threadId, metadata, silent }, context) => {
      patchCachedThread(queryClient, threadId, (current) => {
        const restored = { ...current };
        for (const [key, written] of Object.entries(metadata)) {
          if (restored[key] !== written) continue;
          if (context && key in context.previous) {
            restored[key] = context.previous[key];
          } else delete restored[key];
        }
        return restored;
      });
      if (!silent) toast.error("Couldn't save that change. Please try again.");
    },
  });

  const { mutate, mutateAsync } = mutation;

  const setBookmarked = useCallback(
    (threadId: string, bookmarked: boolean) =>
      mutate({ threadId, metadata: bookmarkPatch(bookmarked) }),
    [mutate],
  );

  const setTitle = useCallback(
    (threadId: string, title: string | null) =>
      mutate({ threadId, metadata: titlePatch(title) }),
    [mutate],
  );

  return { setBookmarked, setTitle, writeMetadata: mutateAsync };
}
