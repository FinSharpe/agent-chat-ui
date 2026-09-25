/**
 * What is left in localStorage of the web build that called MoneyOne from the
 * browser (its store was `src/lib/moneyone/moneyone.storage.ts`, removed in
 * ce57174). Nothing writes these keys any more; `useLegacyConsentAdoption`
 * reads them once to adopt those consents on the backend, and removes them.
 *
 * - `moneyone:consent:<consentID>`: one consent — its ID, type, dates, name,
 *   mobile number and this browser's ID;
 * - `moneyone:pending-consent:<consentHandle>`: a consent journey that was
 *   started, with the mobile number;
 * - `moneyone:user:<browserID>:consents`: the consent IDs, a JSON array;
 * - `moneyone:userId`: a random ID for this browser.
 *
 * Every one of them is under `moneyone:`, and nothing else in this app uses
 * that namespace. Signing out and deleting the account remove all of it;
 * revoking a connection removes what names that connection
 * (finsharpe-agents#283).
 *
 * Nothing here throws: storage may be blocked, and none of this may stand in
 * the way of signing out, deleting an account or revoking a connection.
 */

export const LEGACY_NAMESPACE = "moneyone:";
export const LEGACY_CONSENT_PREFIX = "moneyone:consent:";
export const LEGACY_USER_ID_KEY = "moneyone:userId";

const LEGACY_INDEX = /^moneyone:user:.*:consents$/;

/** Every `moneyone:` key in this browser's localStorage. */
function legacyKeys(): string[] {
  const found: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LEGACY_NAMESPACE)) found.push(key);
  }
  return found;
}

/** Remove every `moneyone:` key. Answers the keys it removed. */
export function purgeLegacyConsentStore(): string[] {
  const removed: string[] = [];
  try {
    for (const key of legacyKeys()) {
      localStorage.removeItem(key);
      removed.push(key);
    }
  } catch {
    // No storage here, or the browser blocks it: there is nothing to reach.
  }
  return removed;
}

/** The consent ID a `moneyone:consent:` record holds, if it can be read. */
function recordedConsentID(raw: string | null): unknown {
  try {
    return (JSON.parse(raw ?? "null") as { consentID?: unknown } | null)
      ?.consentID;
  } catch {
    return undefined;
  }
}

/**
 * The index without `consentID`: the same text when it does not list it,
 * `null` when nothing would be left (or it cannot be read and names it).
 */
function indexWithout(raw: string | null, consentID: string): string | null {
  let ids: unknown;
  try {
    ids = JSON.parse(raw ?? "null");
  } catch {
    return raw?.includes(consentID) ? null : raw;
  }
  if (!Array.isArray(ids)) return raw?.includes(consentID) ? null : raw;
  if (!ids.includes(consentID)) return raw;
  const rest = ids.filter((id) => id !== consentID);
  return rest.length > 0 ? JSON.stringify(rest) : null;
}

/**
 * Remove what names one connection: its `moneyone:consent:` record (by key or
 * by the ID inside it) and its place in each consent index — the index itself
 * once it would be empty. Answers the keys it removed or rewrote.
 */
export function forgetLegacyConsent(consentID: string): string[] {
  const touched: string[] = [];
  try {
    for (const key of legacyKeys()) {
      const raw = localStorage.getItem(key);
      if (key.startsWith(LEGACY_CONSENT_PREFIX)) {
        if (
          key === `${LEGACY_CONSENT_PREFIX}${consentID}` ||
          recordedConsentID(raw) === consentID
        ) {
          localStorage.removeItem(key);
          touched.push(key);
        }
      } else if (LEGACY_INDEX.test(key)) {
        const rest = indexWithout(raw, consentID);
        if (rest === raw) continue;
        if (rest === null) localStorage.removeItem(key);
        else localStorage.setItem(key, rest);
        touched.push(key);
      }
    }
  } catch {
    // No storage here, or the browser blocks it: there is nothing to reach.
  }
  return touched;
}
