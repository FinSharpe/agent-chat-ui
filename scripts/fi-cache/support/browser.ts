/**
 * Just enough browser for the sign-out and deletion paths to run under node:
 * Map-backed local and session storage, a `window.location` that records
 * where the page was sent, the session's readable `user_info` cookie, and a
 * `fetch` each case answers for itself.
 *
 * `window` is installed by `installWindow()`, not on import, so the query
 * library still sees a server when it loads and schedules no garbage
 * collection timers that would keep node alive.
 */
import { QueryClient } from "@tanstack/react-query";
import {
  persistQueryClientRestore,
  persistQueryClientSave,
} from "@tanstack/react-query-persist-client";
import { get, keys, set } from "idb-keyval";
import { USER_INFO_COOKIE } from "@/lib/auth/user-info";
import {
  createQueryPersister,
  persistedFiDataKey,
  QUERY_CACHE_KEY,
} from "@/lib/query-persistence";

export class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  /** Set to make `clear()` throw, as storage a browser blocks does. */
  blocked = false;

  get length() {
    return this.data.size;
  }
  clear() {
    if (this.blocked) throw new Error("SecurityError: storage is blocked");
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

export const localStore = new MemoryStorage();
export const sessionStore = new MemoryStorage();

/** Where the page was last sent, by `href =` or `replace()`. */
export const location = {
  href: "http://localhost/",
  replace(url: string) {
    this.href = url;
  },
};

/** The page's cookies, as `document.cookie` reads them. */
const cookieJar = { cookie: "" };

/** The account `signIn()` signs in, unless told another. */
export const ACCOUNT = "user-1";

/** The BFF has set the session cookies (the readable one is all we see), for
 *  `account`. A sign-in over another account's cookie replaces it. */
export function signIn(account: string = ACCOUNT) {
  cookieJar.cookie = `${USER_INFO_COOKIE}=${encodeURIComponent(
    JSON.stringify({ id: account, name: "Asha", roles: ["USER"] }),
  )}`;
}

/** A readable cookie with no account in it. */
export function signInWithoutAccount() {
  cookieJar.cookie = `${USER_INFO_COOKIE}=${encodeURIComponent(
    JSON.stringify({ name: "Asha", roles: ["USER"] }),
  )}`;
}

/** The BFF's answer removed them, in every tab at once. */
export function endSession() {
  cookieJar.cookie = "";
}

export function installWindow() {
  const g = globalThis as Record<string, unknown>;
  g.localStorage = localStore;
  g.sessionStorage = sessionStore;
  g.location = location;
  g.document = cookieJar;
  g.window = globalThis;
}

export const fetchCalls: string[] = [];

/** Answer every `fetch` from here on with `reply`, recording each request. */
export function answerFetch(reply: () => Promise<Response>) {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls.push(`${init?.method ?? "GET"} ${String(input)}`);
    return reply();
  }) as typeof fetch;
}

/** A reply whose `Set-Cookie` removes the session, as a browser applies it
 *  before `fetch` resolves. */
export const endingSession =
  (reply: () => Promise<Response>) => (): Promise<Response> => {
    endSession();
    return reply();
  };

export const networkDown = () =>
  Promise.reject(new TypeError("Failed to fetch"));

export const status = (code: number, body?: unknown) => () =>
  Promise.resolve(
    body === undefined
      ? new Response(null, { status: code })
      : new Response(JSON.stringify(body), {
          status: code,
          headers: { "Content-Type": "application/json" },
        }),
  );

/** What a browser holding one connection's financial data has in IndexedDB. */
export const fiBlob = (consentID: string) => ({
  consentID,
  holdings: [{ isin: "INE002A01018", units: 12, value: 36_000 }],
});

export const FI_BLOB = fiBlob("consent-1");

/**
 * The copy as the app writes it: the persister `QueryProvider` uses, saving a
 * successful `["fi-data", consentID]` query per connection. `save()`
 * resolves once that save has run — for one inside the persister's 1s
 * throttle, once the throttle has let it.
 */
export function appPersistence(consentIDs: string[] = [FI_BLOB.consentID]) {
  const queryClient = new QueryClient();
  for (const id of consentIDs) {
    queryClient.setQueryData(persistedFiDataKey(id), fiBlob(id));
  }
  const persister = createQueryPersister();
  const save = () =>
    persistQueryClientSave({
      queryClient,
      persister,
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => query.queryKey[0] === "fi-data",
      },
    });
  return { queryClient, persister, save };
}

/**
 * The app holding a copy, with one more save queued behind the persister's
 * throttle — what a cache change just before signing out, deleting or
 * revoking leaves. `queued` resolves once that save has run; `queuedRan()`
 * says whether yet.
 */
export async function appWithQueuedSave(
  consentIDs: string[] = [FI_BLOB.consentID],
) {
  await seedCopy(consentIDs);
  const app = appPersistence(consentIDs);
  await app.save(); // runs at once
  let ran = false;
  const queued = app.save().then(() => {
    ran = true;
  });
  return { ...app, queued, queuedRan: () => ran };
}

/**
 * A page starting: `QueryProvider`'s persister restores the copy into an
 * empty query client, as `PersistQueryClientProvider` does, under whoever
 * the cookie says is signed in then.
 */
export async function startPage() {
  const page = appPersistence([]);
  await persistQueryClientRestore({
    queryClient: page.queryClient,
    persister: page.persister,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    buster: "",
  });
  return page;
}

/** The connections whose data a page holds in memory. */
export function heldConsents(queryClient: QueryClient): string[] {
  return queryClient
    .getQueryCache()
    .findAll({ queryKey: ["fi-data"] })
    .map(({ queryKey }) => String(queryKey[1]))
    .sort();
}

/**
 * Put a copy straight into IndexedDB, as an earlier page (or tab) left it:
 * written for `owner`, or — `null` — as a build from before copies named
 * their account wrote it.
 */
export async function seedCopy(
  consentIDs: string[] = [FI_BLOB.consentID],
  owner: string | null = ACCOUNT,
) {
  await set(
    QUERY_CACHE_KEY,
    JSON.stringify({
      ...(owner === null ? {} : { owner }),
      buster: "",
      timestamp: Date.now(),
      clientState: {
        mutations: [],
        queries: consentIDs.map((id) => ({
          queryKey: persistedFiDataKey(id),
          queryHash: JSON.stringify(persistedFiDataKey(id)),
          state: { data: fiBlob(id), status: "success" },
        })),
      },
    }),
  );
}

/** Every key in the persister's IndexedDB store. */
export async function storedKeys(): Promise<string[]> {
  return (await keys()).map(String);
}

/**
 * The connections whose data the persisted copy holds, or `null` when there
 * is no copy at all.
 */
export async function storedConsents(): Promise<string[] | null> {
  const stored = await get<string>(QUERY_CACHE_KEY);
  if (stored === undefined) return null;
  const copy = JSON.parse(stored) as {
    clientState: { queries: { queryKey: unknown[] }[] };
  };
  return copy.clientState.queries.map(({ queryKey }) => String(queryKey[1]));
}

/**
 * The account the persisted copy names, `null` when it names none, or
 * `undefined` when there is no copy.
 */
export async function storedOwner(): Promise<string | null | undefined> {
  const stored = await get<string>(QUERY_CACHE_KEY);
  if (stored === undefined) return undefined;
  const { owner } = JSON.parse(stored) as { owner?: string };
  return owner ?? null;
}

/**
 * The old web build's consent records, as it left them in localStorage
 * (`moneyone.storage.ts`, removed in ce57174): one record per consent, the
 * index of their IDs, a journey that was started and never finished, and the
 * browser's own ID.
 */
export function seedLegacyRecords(consentIDs: string[]) {
  const browserID = "browser-1";
  localStore.setItem("moneyone:userId", browserID);
  for (const id of consentIDs) {
    localStore.setItem(
      `moneyone:consent:${id}`,
      JSON.stringify({
        consentID: id,
        type: "EQUITIES",
        userId: browserID,
        name: "Asha",
        mobileNo: "9999999999",
      }),
    );
  }
  localStore.setItem(
    `moneyone:user:${browserID}:consents`,
    JSON.stringify(consentIDs),
  );
  localStore.setItem(
    "moneyone:pending-consent:handle-1",
    JSON.stringify({ consentHandle: "handle-1", mobileNo: "9999999999" }),
  );
}

/** Every `moneyone:` key in local storage, sorted. */
export function legacyKeys(): string[] {
  const found: string[] = [];
  for (let i = 0; i < localStore.length; i++) {
    const key = localStore.key(i);
    if (key?.startsWith("moneyone:")) found.push(key);
  }
  return found.sort();
}

/** The local storage keys whose name or value mentions `text`. */
export function localKeysNaming(text: string): string[] {
  const found: string[] = [];
  for (let i = 0; i < localStore.length; i++) {
    const key = localStore.key(i);
    if (key && (key.includes(text) || localStore.getItem(key)?.includes(text)))
      found.push(key);
  }
  return found;
}

let failures = 0;
let finished = false;

/**
 * A check reports only through `finish()`. If something it awaits never
 * settles — a sign-out, a deletion or a clear that hangs — and no timer is
 * left, node runs out of work and would exit 0 without reaching `finish()`,
 * so a path that never completes would read as a pass. It fails instead.
 * (`process.exit` does not emit `beforeExit`, so this never fires after
 * `finish()`; the flag says so outright.)
 */
process.on("beforeExit", () => {
  if (finished) return;
  console.log(
    "FAIL the check ended before finish(): an awaited promise never settled",
  );
  process.exit(1);
});

export function eq(actual: unknown, expected: unknown, name: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${name}\n  got:      ${a}\n  expected: ${e}`);
  } else {
    console.log(`ok   ${name}`);
  }
}

export function finish() {
  finished = true;
  if (failures > 0) {
    console.log(`\n${failures} failure(s)`);
    process.exit(1);
  }
  console.log("\nall passed");
  process.exit(0);
}
