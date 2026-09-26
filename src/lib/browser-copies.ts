/**
 * What this browser keeps about a user's Account Aggregator connections once
 * the tab is closed, and the two ways it goes (finsharpe-agents#283):
 *
 * - the persisted query cache in IndexedDB, holding connected financial data
 *   (`query-persistence.ts`);
 * - the old web build's consent records in localStorage, under `moneyone:`
 *   (`legacy-consent-store.ts`).
 *
 * Signing out and deleting the account call `clearBrowserCopies()`; revoking
 * a connection calls `forgetConnectionCopies()`. Each runs once its request
 * has settled, whatever the outcome, so a path that fails part-way still
 * leaves nothing behind. Neither rejects, and neither waits on storage for
 * more than `CLEAR_TIMEOUT_MS`.
 */
import type { QueryClient } from "@tanstack/react-query";
import {
  forgetLegacyConsent,
  purgeLegacyConsentStore,
} from "@/lib/legacy-consent-store";
import {
  clearPersistedQueryCache,
  forgetPersistedConnection,
  persistedFiDataKey,
} from "@/lib/query-persistence";

/** Everything, for every connection: signing out, deleting the account. */
export async function clearBrowserCopies(): Promise<void> {
  purgeLegacyConsentStore();
  await clearPersistedQueryCache();
}

/**
 * Everything for one connection: revoking it. The page's in-memory copy of
 * the persisted query goes too, so nothing on this page can save it again.
 */
export async function forgetConnectionCopies(
  queryClient: QueryClient,
  consentID: string,
): Promise<void> {
  forgetLegacyConsent(consentID);
  queryClient.removeQueries({ queryKey: persistedFiDataKey(consentID) });
  await forgetPersistedConnection(consentID);
}
