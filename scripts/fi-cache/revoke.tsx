/**
 * Revoking a connection on the web leaves nothing of it in this browser
 * (finsharpe-agents#283, decision W1): not its data in the persisted query
 * cache, not the page's in-memory copy of that query, and not the old web
 * build's consent record for it (`moneyone:consent:<id>` and its place in the
 * consent index). The real `useRevokeConsent` runs against a spec IndexedDB,
 * with a second connection kept and a persister save queued a moment before
 * each attempt. After every outcome the revoked connection is gone — and stays
 * gone once that queued save has run — while the kept one is untouched:
 *
 * - the revoke succeeds, or finds the consent already gone;
 * - the server fails part-way (`502`), or no answer arrives: what the browser
 *   kept goes all the same, since a revoke may have happened;
 * - the last connection: the persisted copy itself is removed, not left empty.
 */
import "./support/indexeddb";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { persistedFiDataKey } from "@/lib/query-persistence";
import { useRevokeConsent } from "@/modules/import-data/hooks/useAaMutations";
import type { ConsentRecord } from "@/modules/import-data/types/aa";
import {
  answerFetch,
  appWithQueuedSave,
  eq,
  fetchCalls,
  finish,
  installWindow,
  legacyKeys,
  localKeysNaming,
  localStore,
  networkDown,
  seedLegacyRecords,
  signIn,
  status,
  storedConsents,
  storedKeys,
} from "./support/browser";

type Revoke = ReturnType<typeof useRevokeConsent>;

/** The hook's real mutation, over the page's query client. */
function renderRevoke(queryClient: QueryClient): Revoke["mutateAsync"] {
  let revoke: Revoke | null = null;
  function Probe() {
    revoke = useRevokeConsent();
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <Probe />
    </QueryClientProvider>,
  );
  return revoke!.mutateAsync;
}

const consent = (consentID: string): ConsentRecord => ({
  consentID,
  type: "EQUITIES",
  mobileNo: "9999999999",
  consentCreationData: "2026-01-01T00:00:00Z",
  consentExpiry: "2027-01-01T00:00:00Z",
  isDataReady: true,
});

const KEPT = "consent-kept";

/**
 * Revoke `revoked` against `reply`, with `KEPT` connected too unless this is
 * the last connection; whether the revoke rejected.
 */
async function revoke(
  label: string,
  revoked: string,
  reply: () => Promise<Response>,
  { last = false } = {},
) {
  const connected = last ? [revoked] : [revoked, KEPT];
  signIn();
  seedLegacyRecords(connected);
  // A record copied under another key still names the connection inside it.
  localStore.setItem(
    "moneyone:consent:copied",
    JSON.stringify({ consentID: revoked, mobileNo: "9999999999" }),
  );
  const app = await appWithQueuedSave(connected);
  eq(await storedConsents(), connected, `${label}: setup, a copy is kept`);
  eq(
    localKeysNaming(revoked).length,
    3,
    `${label}: setup, and its old records`,
  );

  answerFetch(reply);
  let rejected = false;
  try {
    await renderRevoke(app.queryClient)(consent(revoked));
  } catch {
    rejected = true;
  }

  eq(
    fetchCalls.at(-1),
    `DELETE /api/utilities/aa/consents/${revoked}`,
    `${label}: asks the server`,
  );
  const left = last ? null : [KEPT];
  eq(await storedConsents(), left, `${label}: its data is gone from the copy`);
  eq(
    app.queryClient.getQueryData(persistedFiDataKey(revoked)),
    undefined,
    `${label}: and from the page's memory`,
  );
  eq(localKeysNaming(revoked), [], `${label}: no old record names it`);
  eq(app.queuedRan(), false, `${label}: a save queued before is still waiting`);
  await app.queued;
  eq(
    await storedConsents(),
    left,
    `${label}: once run, it did not put it back`,
  );

  if (!last) {
    eq(
      app.queryClient.getQueryData(persistedFiDataKey(KEPT)) !== undefined,
      true,
      `${label}: the other connection stays in memory`,
    );
    eq(
      legacyKeys(),
      [
        `moneyone:consent:${KEPT}`,
        "moneyone:pending-consent:handle-1",
        "moneyone:user:browser-1:consents",
        "moneyone:userId",
      ],
      `${label}: and its old record, with the rest of the old store`,
    );
    eq(
      localStore.getItem("moneyone:user:browser-1:consents"),
      JSON.stringify([KEPT]),
      `${label}: the index lists only the other connection`,
    );
  } else {
    eq(
      legacyKeys(),
      ["moneyone:pending-consent:handle-1", "moneyone:userId"],
      `${label}: the index goes with its last entry`,
    );
  }

  app.queryClient.clear();
  localStore.clear();
  return rejected;
}

(async () => {
  installWindow();

  const ok = await revoke(
    "revoked",
    "consent-a",
    status(200, { revoked: true, alreadyGone: false }),
  );
  eq(ok, false, "revoked: succeeds");

  const gone = await revoke(
    "already gone",
    "consent-b",
    status(200, { revoked: false, alreadyGone: true }),
  );
  eq(gone, false, "already gone: succeeds");

  const partWay = await revoke(
    "502",
    "consent-c",
    status(502, { detail: { kind: "transient", message: "AA unreachable" } }),
  );
  eq(partWay, true, "502: reported as failed");

  const lost = await revoke("no answer", "consent-d", networkDown);
  eq(lost, true, "no answer: reported as failed");

  const last = await revoke(
    "last connection",
    "consent-e",
    status(200, { revoked: true, alreadyGone: false }),
    { last: true },
  );
  eq(last, false, "last connection: succeeds");
  eq(await storedKeys(), [], "last connection: the copy itself is removed");

  finish();
})();
