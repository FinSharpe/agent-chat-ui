/**
 * Signing out leaves no copy of connected financial data in this browser
 * (finsharpe-agents#283, decision D10). The real `logout` from `AuthProvider`
 * runs against a spec IndexedDB, with a persister save queued a moment before
 * each sign-out, and after every outcome the persister's store is empty — and
 * stays empty once that queued save has run:
 *
 * - the request succeeds: the copy is gone and the page leaves for Welcome;
 * - the request never reaches the server: the copy is gone all the same, and
 *   sign-out still fails as it did (no redirect, the caller is told) — the
 *   session is still there, so only this page's guard stops the queued save;
 * - the server answers with an error: the copy is gone and the page leaves.
 */
import "./support/indexeddb";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { QUERY_CACHE_KEY } from "@/lib/query-persistence";
import { AUTH_ROUTES } from "@/modules/auth/constants/routes";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import {
  answerFetch,
  appWithQueuedSave,
  endingSession,
  eq,
  fetchCalls,
  finish,
  installWindow,
  location,
  networkDown,
  signIn,
  status,
  storedKeys,
} from "./support/browser";

type Auth = ReturnType<typeof useAuth>;

/** The provider's real `logout`, taken from a server render. */
function renderLogout(): Auth["logout"] {
  let auth: Auth | null = null;
  function Probe() {
    auth = useAuth();
    return null;
  }
  renderToStaticMarkup(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  return auth!.logout;
}

const START = "http://localhost/import";

/** Sign out against `reply`; whether `logout` rejected. */
async function signOut(label: string, reply: () => Promise<Response>) {
  signIn();
  location.href = START;
  const app = await appWithQueuedSave();
  eq(await storedKeys(), [QUERY_CACHE_KEY], `${label}: setup, a copy is kept`);

  answerFetch(reply);
  let rejected = false;
  try {
    await renderLogout()();
  } catch {
    rejected = true;
  }

  eq(fetchCalls.at(-1), "POST /api/auth/logout", `${label}: asks the server`);
  eq(await storedKeys(), [], `${label}: the copy is gone`);
  eq(app.queuedRan(), false, `${label}: a save queued before is still waiting`);
  await app.queued;
  eq(await storedKeys(), [], `${label}: once run, it did not put it back`);
  app.queryClient.clear();
  return rejected;
}

(async () => {
  installWindow();

  // First, before this page has cleared anything, so its saves really write.
  const noAnswer = await signOut("no answer", networkDown);
  eq(noAnswer, true, "no answer: sign-out still reports the failure");
  eq(location.href, START, "no answer: and stays on the page, as before");

  const ok = await signOut(
    "ok",
    endingSession(status(200, { message: "Logged out" })),
  );
  eq(ok, false, "ok: sign-out succeeds");
  eq(location.href, AUTH_ROUTES.welcome, "ok: leaves for Welcome");

  // A route that crashed: an error, and the session cookies left as they were.
  const crashed = await signOut("500", status(500));
  eq(crashed, false, "500: sign-out goes on, as before");
  eq(location.href, AUTH_ROUTES.welcome, "500: leaves for Welcome");

  finish();
})();
