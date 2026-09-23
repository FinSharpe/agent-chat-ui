import { useApiUrl } from "@/hooks/useDefaultApiValues";
import { getApiKey } from "@/lib/api-key";
import { createClient } from "@/providers/client";
import { Thread } from "@langchain/langgraph-sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const THREADS_QUERY_FILTER = { queryKey: ["threads"] };

/**
 * Deletes a thread on the LangGraph server. The row leaves every cached
 * thread list at once; a refused delete puts the lists back as they were.
 */
export function useDeleteThreadMutation() {
  const [apiUrl] = useApiUrl();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: string) => {
      const client = createClient(apiUrl, getApiKey() ?? undefined);
      await client.threads.delete(threadId);
    },
    onMutate: async (threadId) => {
      await queryClient.cancelQueries(THREADS_QUERY_FILTER);
      const previous =
        queryClient.getQueriesData<Thread[]>(THREADS_QUERY_FILTER);
      queryClient.setQueriesData<Thread[]>(THREADS_QUERY_FILTER, (threads) =>
        threads?.filter((t) => t.thread_id !== threadId),
      );
      return { previous };
    },
    onError: (_error, _threadId, context) => {
      for (const [key, threads] of context?.previous ?? []) {
        queryClient.setQueryData(key, threads);
      }
      toast.error("Couldn't delete that chat. Please try again.");
    },
  });
}
