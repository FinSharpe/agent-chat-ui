/**
 * Clearing what the browser kept never stands in the way of signing out,
 * deleting the account or revoking a connection. With no IndexedDB at all,
 * with local storage blocked as well, or with an IndexedDB that never
 * answers, all three paths finish as they would without the copy — the stuck
 * case after `CLEAR_TIMEOUT_MS`, not never.
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  forgetLegacyConsent,
  purgeLegacyConsentStore,
} from "@/lib/legacy-consent-store";
import {
  CLEAR_TIMEOUT_MS,
  clearPersistedQueryCache,
  forgetPersistedConnection,
} from "@/lib/query-persistence";
import { DELETE_ACCOUNT_PATH } from "@/modules/account-deletion/constants/content";
import { useDeleteAccountMutation } from "@/modules/account-deletion/hooks/useDeleteAccountMutation";
import { AUTH_ROUTES } from "@/modules/auth/constants/routes";
import { useRevokeConsent } from "@/modules/import-data/hooks/useAaMutations";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import {
  answerFetch,
  eq,
  fetchCalls,
  finish,
  installWindow,
  localStore,
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

function renderRevoke() {
  let revoke: ReturnType<typeof useRevokeConsent> | null = null;
  function Probe() {
    revoke = useRevokeConsent();
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <Probe />
    </QueryClientProvider>,
  );
  return revoke!.mutateAsync;
}

const DELETED = `${DELETE_ACCOUNT_PATH}?deleted=1`;

async function everyPath(label: string, maxMs: number) {
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

  answerFetch(status(200, { revoked: true, alreadyGone: false }));
  started = Date.now();
  const revoked = await renderRevoke()({
    consentID: "consent-1",
    type: "EQUITIES",
    mobileNo: "9999999999",
    consentCreationData: "2026-01-01T00:00:00Z",
    consentExpiry: "2027-01-01T00:00:00Z",
    isDataReady: true,
  });
  eq(
    fetchCalls.at(-1),
    "DELETE /api/utilities/aa/consents/consent-1",
    `${label}: asks the server to revoke`,
  );
  eq(revoked.revoked, true, `${label}: revoking still finishes`);
  eq(Date.now() - started <= maxMs, true, `${label}: without hanging`);
}

/** Local storage a browser blocks: even reaching it throws. */
function blockLocalStorage(blocked: boolean) {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    ...(blocked
      ? {
          get: () => {
            throw new DOMException(
              "The operation is insecure.",
              "SecurityError",
            );
          },
        }
      : { value: localStore, writable: true }),
  });
}

(async () => {
  installWindow();
  const g = globalThis as Record<string, unknown>;

  // A browser with IndexedDB switched off: opening a database throws.
  delete g.indexedDB;
  eq(await clearPersistedQueryCache(), false, "no IndexedDB: nothing cleared");
  eq(
    await forgetPersistedConnection("consent-1"),
    false,
    "no IndexedDB: nothing forgotten",
  );
  await everyPath("no IndexedDB", 500);

  // …and local storage blocked too.
  blockLocalStorage(true);
  eq(purgeLegacyConsentStore(), [], "no storage: no old record purged");
  eq(forgetLegacyConsent("consent-1"), [], "no storage: none forgotten");
  await everyPath("no storage at all", 500);
  blockLocalStorage(false);

  // Storage that never answers: the open request never settles.
  g.indexedDB = { open: () => ({}) };
  let started = Date.now();
  eq(await clearPersistedQueryCache(), false, "stuck: gives up");
  eq(
    Date.now() - started >= CLEAR_TIMEOUT_MS - 50,
    true,
    "stuck: after the timeout",
  );
  started = Date.now();
  eq(
    await forgetPersistedConnection("consent-1"),
    false,
    "stuck: forgetting gives up",
  );
  eq(
    Date.now() - started >= CLEAR_TIMEOUT_MS - 50,
    true,
    "stuck: after the timeout",
  );
  await everyPath("stuck", CLEAR_TIMEOUT_MS + 1_000);

  finish();
})();
