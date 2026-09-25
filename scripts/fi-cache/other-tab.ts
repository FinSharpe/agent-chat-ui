/**
 * The copy is only kept while someone is signed in. Signing out in one tab
 * clears IndexedDB and, through the BFF, the session cookies of every tab;
 * this file is another page — whose persister has never been cleared — that
 * holds the copy in memory:
 *
 * - once the session is gone, its next save writes nothing;
 * - a page starting with nobody signed in removes a copy it finds (one a
 *   failed clear left, or one an account deleted from another device left)
 *   rather than loading it;
 * - signed in again, it reads and writes as before, so the rule is the
 *   session and not a persister that has stopped working.
 */
import "./support/indexeddb";

import { del } from "idb-keyval";

import { QUERY_CACHE_KEY } from "@/lib/query-persistence";
import {
  appPersistence,
  endSession,
  eq,
  finish,
  installWindow,
  seedCopy,
  signIn,
  storedKeys,
} from "./support/browser";

(async () => {
  installWindow();
  signIn();
  const tab = appPersistence();
  await tab.save();
  eq(await storedKeys(), [QUERY_CACHE_KEY], "setup: this tab wrote the copy");

  // Another tab signs out: its clear, and the BFF's answer.
  endSession();
  await del(QUERY_CACHE_KEY);

  await tab.save();
  eq(await storedKeys(), [], "signed out elsewhere: this tab writes nothing");

  await seedCopy();
  eq(
    await tab.persister.restoreClient(),
    undefined,
    "nobody signed in: a copy left behind is not loaded",
  );
  eq(await storedKeys(), [], "nobody signed in: and is removed");

  signIn();
  await seedCopy();
  eq(
    (await tab.persister.restoreClient())?.clientState.queries.length,
    1,
    "signed in again: the copy is read",
  );
  await del(QUERY_CACHE_KEY);
  await tab.save();
  eq(await storedKeys(), [QUERY_CACHE_KEY], "signed in again: and written");

  tab.queryClient.clear();
  finish();
})();
