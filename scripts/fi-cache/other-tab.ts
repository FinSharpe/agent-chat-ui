/**
 * The copy is only kept while someone is signed in, and only for connections
 * that have not been revoked. Signing out in one tab clears IndexedDB and,
 * through the BFF, the session cookies of every tab; revoking a connection in
 * one tab removes it from IndexedDB. This file is another page — whose
 * persister has never been cleared — that holds the copy in memory:
 *
 * - once the session is gone, its next save writes nothing;
 * - a page starting with nobody signed in removes a copy it finds (one a
 *   failed clear left, or one an account deleted from another device left)
 *   rather than loading it, and every one of the old web build's consent
 *   records with it; a page starting signed in leaves those for Import to
 *   adopt;
 * - signed in again, it reads the copy; once another tab has revoked one of
 *   the connections it read, its next save does not put that one back — nor
 *   the last one, when that tab removed the whole copy;
 * - it still writes what it did not read from the copy, so the rule is what
 *   left the copy and not a persister that has stopped working;
 * - and after a sign-out and a new sign-in elsewhere, nothing it read from
 *   the copy comes back.
 */
import "./support/indexeddb";

import { del } from "idb-keyval";

import { persistedFiDataKey, QUERY_CACHE_KEY } from "@/lib/query-persistence";
import {
  appPersistence,
  endSession,
  eq,
  fiBlob,
  finish,
  installWindow,
  legacyKeys,
  seedCopy,
  seedLegacyRecords,
  signIn,
  storedConsents,
  storedKeys,
} from "./support/browser";

const FIRST = "consent-1";
const SECOND = "consent-2";
const LATER = "consent-3";

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
  seedLegacyRecords([FIRST]);
  eq(legacyKeys().length, 4, "setup: old consent records are kept");
  eq(
    await tab.persister.restoreClient(),
    undefined,
    "nobody signed in: a copy left behind is not loaded",
  );
  eq(await storedKeys(), [], "nobody signed in: and is removed");
  eq(
    legacyKeys(),
    [],
    "nobody signed in: and every old consent record goes with it",
  );

  signIn();
  await seedCopy([FIRST, SECOND]);
  seedLegacyRecords([FIRST]);
  const records = legacyKeys();
  eq(
    (await tab.persister.restoreClient())?.clientState.queries.length,
    2,
    "signed in again: the copy is read",
  );
  eq(
    legacyKeys(),
    records,
    "signed in: the old consent records are left for Import to adopt",
  );
  tab.queryClient.setQueryData(persistedFiDataKey(SECOND), fiBlob(SECOND));

  // Another tab revokes the first connection: what its forget leaves.
  await seedCopy([SECOND]);
  await tab.save();
  eq(
    await storedConsents(),
    [SECOND],
    "revoked elsewhere: this tab does not put that connection back",
  );

  // …and then the last one, which removes the copy.
  await del(QUERY_CACHE_KEY);
  await tab.save();
  eq(await storedKeys(), [], "last one revoked elsewhere: nothing comes back");

  tab.queryClient.setQueryData(persistedFiDataKey(LATER), fiBlob(LATER));
  await tab.save();
  eq(
    await storedConsents(),
    [LATER],
    "signed in: what this tab did not read from the copy is still written",
  );

  // Another tab signs out, and someone signs in again while this one is open.
  endSession();
  await del(QUERY_CACHE_KEY);
  signIn();
  await tab.save();
  eq(
    await storedConsents(),
    [LATER],
    "signed out and in elsewhere: nothing this tab read from the copy returns",
  );

  tab.queryClient.clear();
  finish();
})();
