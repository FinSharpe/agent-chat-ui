/**
 * The query cache's copy in IndexedDB — the one place this browser keeps
 * connected financial data once the tab is closed.
 *
 * `QueryProvider` persists successful `["fi-data", consentID]` queries, and
 * nothing else (`COPY_DEHYDRATE_OPTIONS`), through `createQueryPersister()`,
 * into idb-keyval's default database and store under `QUERY_CACHE_KEY`.
 * Import keys its own FI queries `["aa", "fi-data", …]` since it moved to the
 * backend, so what this holds is a snapshot an earlier build wrote — but that
 * snapshot is restored when the app starts and written
 * back on every cache change, so for anyone who keeps opening the app it
 * outlives the persister's 7-day `maxAge`.
 *
 * Four rules keep it from outliving the session or the connection
 * (finsharpe-agents#283):
 *
 * - signing out and deleting the account call `clearPersistedQueryCache()`,
 *   and revoking a connection calls `forgetPersistedConnection()` for it;
 * - the copy is only kept while someone is signed in — a tab left open cannot
 *   write it back once the session cookies are gone, and a page that starts
 *   with nobody signed in removes any copy it finds instead of loading it,
 *   and the old web build's consent records (`legacy-consent-store.ts`) too;
 * - the copy belongs to the account that wrote it, named in the copy as
 *   `owner`: a page that starts with another account signed in — someone who
 *   signed in here after a session that ended elsewhere, or a new account
 *   made after a deletion — removes it instead of loading it, and so does a
 *   page that finds a copy naming no account (every copy written before this
 *   rule). A page writes only for the first account it finds signed in (the
 *   one it started with, if any): once another account signs in, even in the
 *   same tab, it writes nothing again and leaves no copy but that account's;
 * - a page never writes back a query it loaded from the copy once that query
 *   has left the copy, so a connection revoked in another tab stays gone, and
 *   so does what a sign-out elsewhere removed if someone signs in again while
 *   this tab is still open.
 *
 * A copy with nothing in it is no copy: the entry is removed, not left empty.
 */
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { DehydrateOptions } from "@tanstack/react-query";
import { createStore, del, promisifyRequest } from "idb-keyval";
import { readUserInfoCookie } from "@/lib/auth/user-info";
import { purgeLegacyConsentStore } from "@/lib/legacy-consent-store";

/** The persister's key, named here so the code that clears it cannot drift. */
export const QUERY_CACHE_KEY = "REACT_QUERY_OFFLINE_CACHE";

/** How long signing out, deleting or revoking waits on IndexedDB. */
export const CLEAR_TIMEOUT_MS = 2_000;

/** The query a connection's data is persisted under, as builds before the
 *  backend's Account Aggregator fetched it. */
export const persistedFiDataKey = (consentID: string) =>
  ["fi-data", consentID] as const;

/**
 * What `QueryProvider` dehydrates into the copy: successful
 * `["fi-data", consentID]` queries, and nothing else.
 *
 * - Not the disabled placeholder `["fi-data-disabled"]`, and only a query that
 *   succeeded: `getAllFiData` polled with 3s delays, so the throttled
 *   persister could otherwise snapshot a query still in flight, and the
 *   pending promise it persisted rejected on the next page load ("A query
 *   that was dehydrated as pending ended up rejecting").
 * - No mutation, paused or not. The query library's default keeps a paused
 *   one — any request started while the browser is offline — with its
 *   arguments, so an offline sign-in would put an email and a password into
 *   IndexedDB, and an offline revoke the connection's record with its mobile
 *   number. Nor could a restored one run: no mutation has defaults to run it.
 */
export const COPY_DEHYDRATE_OPTIONS: DehydrateOptions = {
  shouldDehydrateQuery: (query) => {
    const queryKey = query.queryKey;
    return (
      Array.isArray(queryKey) &&
      queryKey[0] === "fi-data" &&
      queryKey.length > 1 &&
      query.state.status === "success"
    );
  },
  shouldDehydrateMutation: () => false,
};

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
 * The account signed in on this browser: the `id` in the readable
 * `user_info` cookie, which the BFF sets with the session and removes on
 * sign-out and on deletion — in every tab at once. `null` when nobody is.
 */
function signedInAccount(): string | null {
  const id: unknown = readUserInfoCookie()?.id;
  return typeof id === "string" && id !== "" ? id : null;
}

interface PersistedQuery {
  queryKey?: unknown;
  queryHash?: unknown;
}

interface PersistedCopy {
  /** The account that wrote the copy. Absent from copies written before. */
  owner?: unknown;
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

/** Whether a stored copy was written for `account`. A copy naming no
 *  account, or that cannot be read, was not. */
const ownedBy = (stored: unknown, account: string): stored is string =>
  parseCopy(stored)?.owner === account;

/** A query holding this connection's data. */
function holdsConnection(query: PersistedQuery, consentID: string) {
  const key = query.queryKey;
  return Array.isArray(key) && key[0] === "fi-data" && key[1] === consentID;
}

/**
 * `value` without the queries `drop` picks, serialized again — or `undefined`
 * when nothing is left in it, which removes the entry. A value that cannot be
 * read is removed too: it cannot be shown to hold nothing it should not.
 * `owner`, when given, is the account the result is written for; otherwise
 * the value keeps the one it names.
 */
function without(
  value: unknown,
  drop: (query: PersistedQuery) => boolean,
  owner?: string,
): string | undefined {
  const copy = parseCopy(value);
  if (!copy?.clientState) return undefined;
  const queries = queriesOf(copy).filter((query) => !drop(query));
  const mutations = copy.clientState.mutations;
  const keepsMutations = Array.isArray(mutations) && mutations.length > 0;
  if (queries.length === 0 && !keepsMutations) return undefined;
  return JSON.stringify({
    ...copy,
    ...(owner === undefined ? {} : { owner }),
    clientState: { ...copy.clientState, queries },
  });
}

/**
 * Read the copy and replace it in one transaction, so no other write — from
 * this page or another tab — can land between the two. `rewrite` answers the
 * new value (the one it was given, to leave it as it is), or `undefined` to
 * remove the entry.
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
            if (next === undefined) {
              if (read.result !== undefined) store.delete(QUERY_CACHE_KEY);
            } else if (next !== read.result) {
              store.put(next, QUERY_CACHE_KEY);
            }
            resolve(promisifyRequest(store.transaction));
          } catch (error) {
            reject(error);
          }
        };
      }),
  );
}

/**
 * The persister for one page (`QueryProvider` builds one). What it has in
 * memory belongs to the account signed in when it first reads or writes the
 * copy, and it reads and writes the copy only for that account.
 */
export function createQueryPersister() {
  /** The account this page holds data for: the first it found signed in. */
  let pageAccount: string | undefined;
  /**
   * Set for the rest of the page once another account has signed in (on the
   * sign-in page, say, which started under the account before): this page
   * may hold the first account's data in memory, so it writes nothing
   * again, as after `cleared`.
   */
  let otherAccount = false;

  /** Whether this page may act for `account`, the one signed in now. */
  const actsFor = (account: string) => {
    if (pageAccount === undefined) pageAccount = account;
    if (account !== pageAccount) otherAccount = true;
    return !otherAccount;
  };

  /** No copy is left but `account`'s own: one another account wrote, or one
   *  naming no account, goes. */
  const keepOnlyCopyOf = (account: string) =>
    rewriteCopy((stored) => (ownedBy(stored, account) ? stored : undefined));

  return createAsyncStoragePersister({
    key: QUERY_CACHE_KEY,
    storage: {
      getItem: async (key) => {
        if (cleared) return undefined;
        const account = signedInAccount();
        if (account === null) {
          // A session that ended without a sign-out here, or an account
          // deleted elsewhere: with nobody signed in, no copy is kept either,
          // nor any of the old web build's consent records.
          purgeLegacyConsentStore();
          await del(key, copyStore);
          return undefined;
        }
        if (!actsFor(account)) {
          await keepOnlyCopyOf(account);
          return undefined;
        }
        // Only the account that wrote the copy loads it. Another account's —
        // left by a session that ended elsewhere before someone else signed
        // in here — is removed, and so is one naming no account.
        let loaded: string | undefined;
        await rewriteCopy((stored) => {
          if (!ownedBy(stored, account)) return undefined;
          loaded = stored;
          return stored;
        });
        hashesOf(parseCopy(loaded)).forEach((hash) => restored.add(hash));
        return loaded;
      },
      setItem: async (_key, value) => {
        if (cleared) return;
        const account = signedInAccount();
        if (account === null) return;
        if (!actsFor(account)) {
          // Someone else signed in while this page held the first account's
          // data: none of it is written, and no copy but theirs is left.
          await keepOnlyCopyOf(account);
          return;
        }
        await rewriteCopy((stored) => {
          const present = hashesOf(parseCopy(stored));
          return without(
            value,
            (query) => {
              const hash = String(query.queryHash);
              // Loaded from the copy and gone from it since: removed on
              // purpose (a revoke, here or in another tab), so not put back.
              if (restored.has(hash) && !present.has(hash)) return true;
              return [...forgotten].some((id) => holdsConnection(query, id));
            },
            account,
          );
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
