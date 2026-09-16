import { Thread } from "@langchain/langgraph-sdk";

/**
 * The per-thread user state kept in LangGraph thread metadata, shared with
 * finsharpe-mobile (ADR-0008 §8 there is the authority; FinSharpe/mobile#144,
 * agent-chat-ui#72). A change to these keys is a change on the phone too.
 *
 * Writes go through `client.threads.update(id, { metadata })`, which the
 * runtime merges into what the thread already carries — so a key cannot be
 * deleted, only overwritten: an un-bookmark nulls `bookmarked_at` and a
 * cleared rename writes the empty string.
 */
export const THREAD_METADATA_KEYS = {
  bookmarked: "bookmarked",
  bookmarkedAt: "bookmarked_at",
  title: "title",
} as const;

export type ThreadMetadataPatch = Record<string, unknown>;

export function isBookmarked(thread: Thread): boolean {
  return thread.metadata?.[THREAD_METADATA_KEYS.bookmarked] === true;
}

/** True once either client has recorded a bookmark decision, true or false. */
export function hasBookmarkDecision(thread: Thread): boolean {
  return (
    typeof thread.metadata?.[THREAD_METADATA_KEYS.bookmarked] === "boolean"
  );
}

/** The user's own title, or null when absent or blank (derive it instead). */
export function getUserTitle(thread: Thread): string | null {
  const title = thread.metadata?.[THREAD_METADATA_KEYS.title];
  return typeof title === "string" && title.trim() ? title.trim() : null;
}

function bookmarkedAtMillis(thread: Thread): number {
  const at = thread.metadata?.[THREAD_METADATA_KEYS.bookmarkedAt];
  const millis = typeof at === "string" ? Date.parse(at) : NaN;
  return Number.isNaN(millis) ? -Infinity : millis;
}

/** Bookmarked threads, newest bookmark first; ties keep the list's order. */
export function selectBookmarkedThreads(threads: Thread[]): Thread[] {
  return threads
    .filter(isBookmarked)
    .sort((a, b) => bookmarkedAtMillis(b) - bookmarkedAtMillis(a));
}

export function bookmarkPatch(
  bookmarked: boolean,
  at: Date = new Date(),
): ThreadMetadataPatch {
  return {
    [THREAD_METADATA_KEYS.bookmarked]: bookmarked,
    [THREAD_METADATA_KEYS.bookmarkedAt]: bookmarked ? at.toISOString() : null,
  };
}

/** A blank title clears the rename, so the first message's title shows again. */
export function titlePatch(title: string | null): ThreadMetadataPatch {
  return { [THREAD_METADATA_KEYS.title]: title?.trim() ?? "" };
}
