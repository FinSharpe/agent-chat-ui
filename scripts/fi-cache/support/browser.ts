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
import { persistQueryClientSave } from "@tanstack/react-query-persist-client";
import { keys, set } from "idb-keyval";
import { USER_INFO_COOKIE } from "@/lib/auth/user-info";
import { createQueryPersister, QUERY_CACHE_KEY } from "@/lib/query-persistence";

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

/** The BFF has set the session cookies (the readable one is all we see). */
export function signIn() {
  cookieJar.cookie = `${USER_INFO_COOKIE}=${encodeURIComponent(
    JSON.stringify({ id: "user-1", name: "Asha", roles: ["USER"] }),
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

/** What a browser holding connected financial data has in IndexedDB. */
export const FI_BLOB = {
  consentID: "consent-1",
  holdings: [{ isin: "INE002A01018", units: 12, value: 36_000 }],
};

/**
 * The copy as the app writes it: the persister `QueryProvider` uses, saving a
 * successful `["fi-data", consentID]` query. `save()` resolves once that save
 * has run — for one inside the persister's 1s throttle, once the throttle has
 * let it.
 */
export function appPersistence() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(["fi-data", FI_BLOB.consentID], FI_BLOB);
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
 * throttle — what a cache change just before signing out or deleting leaves.
 * `queued` resolves once that save has run; `queuedRan()` says whether yet.
 */
export async function appWithQueuedSave() {
  await seedCopy();
  const app = appPersistence();
  await app.save(); // runs at once
  let ran = false;
  const queued = app.save().then(() => {
    ran = true;
  });
  return { ...app, queued, queuedRan: () => ran };
}

/** Put a copy straight into IndexedDB, as an earlier page (or tab) left it. */
export async function seedCopy() {
  await set(
    QUERY_CACHE_KEY,
    JSON.stringify({
      buster: "",
      timestamp: Date.now(),
      clientState: {
        mutations: [],
        queries: [
          {
            queryKey: ["fi-data", FI_BLOB.consentID],
            queryHash: `["fi-data","${FI_BLOB.consentID}"]`,
            state: { data: FI_BLOB, status: "success" },
          },
        ],
      },
    }),
  );
}

/** Every key in the persister's IndexedDB store. */
export async function storedKeys(): Promise<string[]> {
  return (await keys()).map(String);
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
