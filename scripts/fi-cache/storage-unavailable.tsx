/**
 * Clearing the copy never stands in the way of signing out or deleting the
 * account. With no IndexedDB at all, or one that never answers, both paths
 * finish as they would without the copy — the stuck case after
 * `CLEAR_TIMEOUT_MS`, not never.
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  CLEAR_TIMEOUT_MS,
  clearPersistedQueryCache,
} from "@/lib/query-persistence";
import { DELETE_ACCOUNT_PATH } from "@/modules/account-deletion/constants/content";
import { useDeleteAccountMutation } from "@/modules/account-deletion/hooks/useDeleteAccountMutation";
import { AUTH_ROUTES } from "@/modules/auth/constants/routes";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import {
  answerFetch,
  eq,
  finish,
  installWindow,
  location,
  status,
} from "./support/browser";

function renderLogout() {
  let auth: ReturnType<typeof useAuth> | null = null;
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

function renderDeletion() {
  let deletion: ReturnType<typeof useDeleteAccountMutation> | null = null;
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

const DELETED = `${DELETE_ACCOUNT_PATH}?deleted=1`;

async function bothPaths(label: string, maxMs: number) {
  location.href = "http://localhost/import";
  answerFetch(status(200, { message: "Logged out" }));
  let started = Date.now();
  await renderLogout()();
  eq(location.href, AUTH_ROUTES.welcome, `${label}: sign-out still leaves`);
  eq(Date.now() - started <= maxMs, true, `${label}: without hanging`);

  location.href = `http://localhost${DELETE_ACCOUNT_PATH}`;
  answerFetch(status(204));
  started = Date.now();
  await renderDeletion()();
  eq(location.href, DELETED, `${label}: deletion still finishes`);
  eq(Date.now() - started <= maxMs, true, `${label}: without hanging`);
}

(async () => {
  installWindow();
  const g = globalThis as Record<string, unknown>;

  // A browser with IndexedDB switched off: opening a database throws.
  delete g.indexedDB;
  eq(await clearPersistedQueryCache(), false, "no IndexedDB: nothing cleared");
  await bothPaths("no IndexedDB", 500);

  // Storage that never answers: the open request never settles.
  g.indexedDB = { open: () => ({}) };
  const started = Date.now();
  eq(await clearPersistedQueryCache(), false, "stuck: gives up");
  eq(
    Date.now() - started >= CLEAR_TIMEOUT_MS - 50,
    true,
    "stuck: after the timeout",
  );
  await bothPaths("stuck", CLEAR_TIMEOUT_MS + 1_000);

  finish();
})();
