/**
 * The query cache's copy in IndexedDB — the one place this browser keeps
 * connected financial data once the tab is closed.
 *
 * `QueryProvider` persists successful `["fi-data", consentID]` queries through
 * `createQueryPersister()`, into idb-keyval's default database and store under
 * `QUERY_CACHE_KEY`. Import keys its own FI queries `["aa", "fi-data", …]`
 * since it moved to the backend, so what this holds is a snapshot an earlier
 * build wrote — but that snapshot is restored when the app starts and written
 * back on every cache change, so for anyone who keeps opening the app it
 * outlives the persister's 7-day `maxAge`.
 *
 * Three rules keep it from outliving the session or the connection
 * (finsharpe-agents#283):
 *
 * - signing out and deleting the account call `clearPersistedQueryCache()`,
 *   and revoking a connection calls `forgetPersistedConnection()` for it;
 * - the copy is only kept while someone is signed in — a tab left open cannot
 *   write it back once the session cookies are gone, and a page that starts
 *   with nobody signed in removes any copy it finds instead of loading it;
 * - a page never writes back a query it loaded from the copy once that query
 *   has left the copy, so a connection revoked in another tab stays gone, and
 *   so does what a sign-out elsewhere removed if someone signs in again while
 *   this tab is still open.
 *
 * A copy with nothing in it is no copy: the entry is removed, not left empty.
 */
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { createStore, del, get, promisifyRequest } from "idb-keyval";
import { readUserInfoCookie } from "@/lib/auth/user-info";

/** The persister's key, named here so the code that clears it cannot drift. */
export const QUERY_CACHE_KEY = "REACT_QUERY_OFFLINE_CACHE";

/** How long signing out, deleting or revoking waits on IndexedDB. */
export const CLEAR_TIMEOUT_MS = 2_000;

/** The query a connection's data is persisted under, as builds before the
 *  backend's Account Aggregator fetched it. */
export const persistedFiDataKey = (consentID: string) =>
  ["fi-data", consentID] as const;

/**
 * idb-keyval's default database and store, so copies written by earlier
 * builds are found. One connection for every read and write here, so this
 * page's transactions run in the order they are made.
 */
const copyStore = createStore("keyval-store", "keyval");

/**
 * Set for the rest of the page once clearing starts. The persister saves on a
 * throttle, so a save queued just before could otherwise run after the clear
 * and put the copy back. A save already handed to IndexedDB is ordered before
 * the clear's own transaction, so the clear still has the last word.
 */
let cleared = false;

/** Connections revoked on this page: never written again, for the same
 *  reason as `cleared`. */
const forgotten = new Set<string>();

/** Queries this page loaded from the copy, by `queryHash`. */
const restored = new Set<string>();

/**
 * Signed in on this browser: the readable `user_info` cookie, which the BFF
 * sets with the session and removes on sign-out and on deletion — in every
 * tab at once.
 */
const inSession = () => readUserInfoCookie() !== null;

interface PersistedQuery {
  queryKey?: unknown;
  queryHash?: unknown;
}

interface PersistedCopy {
  clientState?: { queries?: PersistedQuery[]; mutations?: unknown[] };
}

function parseCopy(value: unknown): PersistedCopy | null {
  if (typeof value !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object"
      ? (parsed as PersistedCopy)
      : null;
  } catch {
    return null;
  }
}

function queriesOf(copy: PersistedCopy | null): PersistedQuery[] {
  const queries = copy?.clientState?.queries;
  return Array.isArray(queries) ? queries : [];
}

const hashesOf = (copy: PersistedCopy | null) =>
  new Set(queriesOf(copy).map((query) => String(query.queryHash)));

/** A query holding this connection's data. */
function holdsConnection(query: PersistedQuery, consentID: string) {
  const key = query.queryKey;
  return Array.isArray(key) && key[0] === "fi-data" && key[1] === consentID;
}

/**
 * `value` without the queries `drop` picks, serialized again — or `undefined`
 * when nothing is left in it, which removes the entry. A value that cannot be
 * read is removed too: it cannot be shown to hold nothing it should not.
 */
function without(
  value: unknown,
  drop: (query: PersistedQuery) => boolean,
): string | undefined {
  const copy = parseCopy(value);
  if (!copy?.clientState) return undefined;
  const queries = queriesOf(copy).filter((query) => !drop(query));
  const mutations = copy.clientState.mutations;
  const keepsMutations = Array.isArray(mutations) && mutations.length > 0;
  if (queries.length === 0 && !keepsMutations) return undefined;
  return JSON.stringify({
    ...copy,
    clientState: { ...copy.clientState, queries },
  });
}

/**
 * Read the copy and replace it in one transaction, so no other write — from
 * this page or another tab — can land between the two. `rewrite` answers the
 * new value, or `undefined` to remove the entry.
 */
function rewriteCopy(
  rewrite: (stored: unknown) => string | undefined,
): Promise<void> {
  return copyStore(
    "readwrite",
    (store) =>
      new Promise<void>((resolve, reject) => {
        const read = store.get(QUERY_CACHE_KEY);
        read.onerror = () => reject(read.error);
        read.onsuccess = () => {
          try {
            const next = rewrite(read.result);
            if (next !== undefined) store.put(next, QUERY_CACHE_KEY);
            else if (read.result !== undefined) store.delete(QUERY_CACHE_KEY);
            resolve(promisifyRequest(store.transaction));
          } catch (error) {
            reject(error);
          }
        };
      }),
  );
}

export function createQueryPersister() {
  return createAsyncStoragePersister({
    key: QUERY_CACHE_KEY,
    storage: {
      getItem: async (key) => {
        if (cleared) return undefined;
        if (!inSession()) {
          // A session that ended without a sign-out here, or an account
          // deleted elsewhere: with nobody signed in, no copy is kept either.
          await del(key, copyStore);
          return undefined;
        }
        const stored = await get<string>(key, copyStore);
        hashesOf(parseCopy(stored)).forEach((hash) => restored.add(hash));
        return stored;
      },
      setItem: async (_key, value) => {
        if (cleared || !inSession()) return;
        await rewriteCopy((stored) => {
          const present = hashesOf(parseCopy(stored));
          return without(value, (query) => {
            const hash = String(query.queryHash);
            // Loaded from the copy and gone from it since: removed on
            // purpose (a revoke, here or in another tab), so not put back.
            if (restored.has(hash) && !present.has(hash)) return true;
            return [...forgotten].some((id) => holdsConnection(query, id));
          });
        });
      },
      removeItem: async (key) => await del(key, copyStore),
    },
    throttleTime: 1000, // Throttle persistence writes to once per second
  });
}

/**
 * Run `work` against IndexedDB, but never reject and never wait past
 * `timeoutMs`: storage that is blocked or stuck must not keep anyone from
 * signing out, deleting their account or revoking a connection. `true` once
 * the work is done, `false` if that could not be confirmed.
 */
async function settleWithin(
  work: () => Promise<unknown>,
  timeoutMs: number,
): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work().then(() => true),
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

/**
 * Remove the persisted copy and stop this page writing it again. Never
 * rejects, and never waits on IndexedDB past `timeoutMs`. Resolves `true` once
 * the copy is gone, `false` if that could not be confirmed.
 *
 * Call it once the sign-out or deletion request has settled, whatever its
 * outcome: by then a successful one has removed the session cookies, so no
 * other tab can write the copy back after it is gone.
 */
export async function clearPersistedQueryCache(
  timeoutMs: number = CLEAR_TIMEOUT_MS,
): Promise<boolean> {
  cleared = true;
  return settleWithin(() => del(QUERY_CACHE_KEY, copyStore), timeoutMs);
}

/**
 * Remove one connection's data from the persisted copy — the whole entry, if
 * nothing else is left in it — and stop this page writing that connection
 * again. Another tab holding the same data in memory does not write it back
 * either, because it loaded it from the copy (see `setItem`). Never rejects,
 * and never waits on IndexedDB past `timeoutMs`.
 */
export async function forgetPersistedConnection(
  consentID: string,
  timeoutMs: number = CLEAR_TIMEOUT_MS,
): Promise<boolean> {
  forgotten.add(consentID);
  return settleWithin(
    () =>
      rewriteCopy((stored) =>
        without(stored, (query) => holdsConnection(query, consentID)),
      ),
    timeoutMs,
  );
}
