/**
 * The query cache's copy in IndexedDB — the one place this browser keeps
 * connected financial data once the tab is closed.
 *
 * `QueryProvider` persists successful `["fi-data", consentID]` queries through
 * `createQueryPersister()`, into idb-keyval's default store under
 * `QUERY_CACHE_KEY`. Import keys its own FI queries `["aa", "fi-data", …]`
 * since it moved to the backend, so what this holds is a snapshot an earlier
 * build wrote — but that snapshot is restored when the app starts and written
 * back on every cache change, so for anyone who keeps opening the app it
 * outlives the persister's 7-day `maxAge`.
 *
 * Two rules keep it from outliving the session (finsharpe-agents#283):
 * signing out and deleting the account call `clearPersistedQueryCache()`, and
 * the copy is only kept while someone is signed in — a tab left open cannot
 * write it back once the session cookies are gone, and a page that starts
 * with nobody signed in removes any copy it finds instead of loading it.
 */
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { del, get, set } from "idb-keyval";
import { readUserInfoCookie } from "@/lib/auth/user-info";

/** The persister's key, named here so the code that clears it cannot drift. */
export const QUERY_CACHE_KEY = "REACT_QUERY_OFFLINE_CACHE";

/** How long signing out or deleting waits on IndexedDB before going on. */
export const CLEAR_TIMEOUT_MS = 2_000;

/**
 * Set for the rest of the page once clearing starts. The persister saves on a
 * throttle, so a save queued just before could otherwise run after the clear
 * and put the copy back. A save already handed to IndexedDB is ordered before
 * the clear's own transaction, so the clear still has the last word.
 */
let cleared = false;

/**
 * Signed in on this browser: the readable `user_info` cookie, which the BFF
 * sets with the session and removes on sign-out and on deletion — in every
 * tab at once.
 */
const inSession = () => readUserInfoCookie() !== null;

export function createQueryPersister() {
  return createAsyncStoragePersister({
    key: QUERY_CACHE_KEY,
    storage: {
      getItem: async (key) => {
        if (cleared) return undefined;
        if (!inSession()) {
          // A session that ended without a sign-out here, or an account
          // deleted elsewhere: with nobody signed in, no copy is kept either.
          await del(key);
          return undefined;
        }
        return await get<string>(key);
      },
      setItem: async (key, value) => {
        if (!cleared && inSession()) await set(key, value);
      },
      removeItem: async (key) => await del(key),
    },
    throttleTime: 1000, // Throttle persistence writes to once per second
  });
}

/**
 * Remove the persisted copy and stop this page writing it again. Never
 * rejects, and never waits on IndexedDB past `timeoutMs`: storage that is
 * blocked or stuck must not keep anyone from signing out or deleting their
 * account. Resolves `true` once the copy is gone, `false` if that could not be
 * confirmed.
 *
 * Call it once the sign-out or deletion request has settled, whatever its
 * outcome: by then a successful one has removed the session cookies, so no
 * other tab can write the copy back after it is gone.
 */
export async function clearPersistedQueryCache(
  timeoutMs: number = CLEAR_TIMEOUT_MS,
): Promise<boolean> {
  cleared = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      del(QUERY_CACHE_KEY).then(() => true),
      new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), timeoutMs);
      }),
    ]);
  } catch {
    // No IndexedDB here, or it refused: nothing more this page can do.
    return false;
  } finally {
    clearTimeout(timer);
  }
}
