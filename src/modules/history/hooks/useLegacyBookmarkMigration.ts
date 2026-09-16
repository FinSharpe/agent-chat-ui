import { Thread } from "@langchain/langgraph-sdk";
import { useEffect } from "react";
import {
  planLegacyBookmarkMigration,
  readLegacyBookmarks,
  writeLegacyBookmarks,
} from "../utils/legacyBookmarks";
import { bookmarkPatch } from "../utils/threadMetadata";
import { useThreadMetadataMutation } from "./useThreadMetadataMutation";

// Module-level so every mounted list (drawer and Memory page) shares one run,
// and a write that fails is retried on the next page load, not on every refetch.
let running = false;
const attempted = new Set<string>();

/**
 * Moves this browser's pre-#72 bookmarks into thread metadata once the
 * signed-in user's threads are loaded, so they show on the phone too. Ids are
 * dropped from storage as they are written (or found already decided); an id
 * that is not among the user's threads stays for a later load.
 */
export function useLegacyBookmarkMigration(threads: Thread[] | undefined) {
  const { writeMetadata } = useThreadMetadataMutation();

  useEffect(() => {
    if (!threads?.length || running) return;
    const legacyIds = readLegacyBookmarks();
    if (legacyIds.length === 0) return;

    const plan = planLegacyBookmarkMigration(legacyIds, threads);
    const writes = plan.writes.filter((w) => !attempted.has(w.threadId));
    if (writes.length === 0 && plan.settled.length === 0) return;

    running = true;
    writes.forEach((w) => attempted.add(w.threadId));

    void Promise.allSettled(
      writes.map((w) =>
        writeMetadata({
          threadId: w.threadId,
          metadata: bookmarkPatch(true, w.at),
          silent: true,
        }).then(() => w.threadId),
      ),
    )
      .then((results) => {
        const done = new Set([
          ...plan.settled,
          ...results.flatMap((r) =>
            r.status === "fulfilled" ? [r.value] : [],
          ),
        ]);
        // Re-read: another tab may have moved some ids meanwhile.
        writeLegacyBookmarks(
          readLegacyBookmarks().filter((id) => !done.has(id)),
        );
      })
      .finally(() => {
        running = false;
      });
  }, [threads, writeMetadata]);
}
