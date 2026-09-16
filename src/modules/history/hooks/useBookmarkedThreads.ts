import { useThreadsQuery } from "@/hooks/useThreadsQuery";
import { useMemo } from "react";
import { selectBookmarkedThreads } from "../utils/threadMetadata";

export function useBookmarkedThreads() {
  const { data: threads, isLoading } = useThreadsQuery();

  const bookmarkedThreads = useMemo(
    () => selectBookmarkedThreads(threads ?? []),
    [threads],
  );

  return {
    bookmarkedThreads,
    isLoading,
  };
}
