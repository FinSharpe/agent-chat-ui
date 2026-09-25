/**
 * Deleting the account on the web leaves no copy of connected financial data
 * in this browser (finsharpe-agents#283, decision D10). The real
 * `useDeleteAccountMutation` runs against a spec IndexedDB, with a persister
 * save queued a moment before each attempt, and after every outcome the
 * persister's store is empty — and stays empty once that queued save has run:
 *
 * - the server fails part-way (`503`: the account still exists): the copy is
 *   gone, while the account's settings stay and the dialog keeps the reason;
 * - no answer at all (a deletion that may or may not have happened): the copy
 *   is gone;
 * - `204`: the copy is gone, local and session storage are cleared and the
 *   page reloads into its "deleted" state;
 * - `204` with local storage blocked: the copy is gone and the page leaves.
 */
import "./support/indexeddb";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { QUERY_CACHE_KEY } from "@/lib/query-persistence";
import { DELETE_ACCOUNT_PATH } from "@/modules/account-deletion/constants/content";
import {
  DeleteAccountError,
  useDeleteAccountMutation,
} from "@/modules/account-deletion/hooks/useDeleteAccountMutation";
import {
  answerFetch,
  appWithQueuedSave,
  endingSession,
  eq,
  fetchCalls,
  finish,
  installWindow,
  localStore,
  location,
  networkDown,
  sessionStore,
  signIn,
  status,
  storedKeys,
} from "./support/browser";

type Deletion = ReturnType<typeof useDeleteAccountMutation>;

/** The hook's real mutation, taken from a server render. */
function renderDeletion(): Deletion["mutateAsync"] {
  let deletion: Deletion | null = null;
  function Probe() {
    deletion = useDeleteAccountMutation();
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <Probe />
    </QueryClientProvider>,
  );
  return deletion!.mutateAsync;
}

const HERE = `http://localhost${DELETE_ACCOUNT_PATH}`;
const DELETED = `${DELETE_ACCOUNT_PATH}?deleted=1`;
const WATCHLIST = "finsharpe.import.watchlist";

/** Delete against `reply`; the error the attempt failed with, or null. */
async function deleteAccount(label: string, reply: () => Promise<Response>) {
  signIn();
  localStore.setItem(WATCHLIST, '{"state":{"groups":{}}}');
  sessionStore.setItem("fs:aa:pending", '{"type":"EQUITIES"}');
  location.href = HERE;
  const app = await appWithQueuedSave();
  eq(await storedKeys(), [QUERY_CACHE_KEY], `${label}: setup, a copy is kept`);

  answerFetch(reply);
  let error: DeleteAccountError | null = null;
  try {
    await renderDeletion()();
  } catch (caught) {
    error = caught as DeleteAccountError;
  }

  eq(fetchCalls.at(-1), "DELETE /api/auth/me", `${label}: asks the server`);
  eq(await storedKeys(), [], `${label}: the copy is gone`);
  eq(app.queuedRan(), false, `${label}: a save queued before is still waiting`);
  await app.queued;
  eq(await storedKeys(), [], `${label}: once run, it did not put it back`);
  app.queryClient.clear();
  return error;
}

(async () => {
  installWindow();

  // First, before this page has cleared anything, so its saves really write.
  const partWay = await deleteAccount(
    "503",
    status(503, { detail: "Your account was not deleted." }),
  );
  eq(partWay?.status, 503, "503: reported as not deleted");
  eq(localStore.getItem(WATCHLIST) !== null, true, "503: settings are kept");
  eq(location.href, HERE, "503: the page stays, with the reason");

  const lost = await deleteAccount("no answer", networkDown);
  eq(lost?.status, null, "no answer: reported as not reaching FinSharpe");
  eq(location.href, HERE, "no answer: the page stays");

  const done = await deleteAccount("204", endingSession(status(204)));
  eq(done, null, "204: the deletion succeeds");
  eq(localStore.length, 0, "204: local storage is cleared");
  eq(sessionStore.length, 0, "204: session storage is cleared");
  eq(location.href, DELETED, "204: the page reloads as deleted");

  localStore.blocked = true;
  const blocked = await deleteAccount(
    "204, storage blocked",
    endingSession(status(204)),
  );
  localStore.blocked = false;
  eq(blocked, null, "204, storage blocked: the deletion succeeds");
  eq(location.href, DELETED, "204, storage blocked: the page still leaves");

  finish();
})();
