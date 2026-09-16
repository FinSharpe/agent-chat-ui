import { Thread } from "@langchain/langgraph-sdk";
import { hasBookmarkDecision } from "./threadMetadata";

/**
 * Bookmarks used to live only in this browser, as a JSON array of thread ids
 * appended in the order they were made. They move into thread metadata once
 * (#72); this reads what is left of that array and plans the move.
 */
const LEGACY_STORAGE_KEY = "bookmarked_threads";

export function readLegacyBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(LEGACY_STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

/** Keeps the ids still to move; removes the key once none are left. */
export function writeLegacyBookmarks(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    if (ids.length === 0) localStorage.removeItem(LEGACY_STORAGE_KEY);
    else localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable: the move simply runs again on the next load.
  }
}

export interface LegacyBookmarkPlan {
  /** Threads to mark bookmarked, each with the time to stamp. */
  writes: { threadId: string; at: Date }[];
  /** Ids that need no write: metadata already holds a bookmark decision. */
  settled: string[];
  /** Ids not among the signed-in user's threads; left for a later load. */
  unresolved: string[];
}

/**
 * Only the caller's own threads (the owner-scoped search) are written, so a
 * second account in the same browser can neither claim nor discard the first
 * account's bookmarks. A thread whose metadata already says `bookmarked`
 * either way was decided on the phone, and that decision stands.
 *
 * Stamps are a millisecond apart in the array's order, so the newest-first
 * sort keeps the order the bookmarks were made in.
 */
export function planLegacyBookmarkMigration(
  legacyIds: string[],
  threads: Thread[],
  now: Date = new Date(),
): LegacyBookmarkPlan {
  const byId = new Map(threads.map((t) => [t.thread_id, t]));
  const plan: LegacyBookmarkPlan = { writes: [], settled: [], unresolved: [] };
  const ids = [...new Set(legacyIds)];

  ids.forEach((threadId, index) => {
    const thread = byId.get(threadId);
    if (!thread) plan.unresolved.push(threadId);
    else if (hasBookmarkDecision(thread)) plan.settled.push(threadId);
    else {
      const at = new Date(now.getTime() - (ids.length - 1 - index));
      plan.writes.push({ threadId, at });
    }
  });

  return plan;
}
