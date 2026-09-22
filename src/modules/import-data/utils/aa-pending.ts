/**
 * The in-flight consent journey, for the leg where the browser is away on
 * OneMoney's page.
 *
 * Lives in `sessionStorage`, not localStorage, and holds NO consent and NO FI
 * data — only the handle/type/accountID of a journey this tab started, plus
 * when it started. It is the web equivalent of finsharpe-mobile's
 * `PendingConsent` secure-storage record, and it does two jobs on return:
 *
 *  1. tells a *web* return apart from the Android App Link return that lands on
 *     the same `/app/consent-return` URL (only this tab wrote the marker), and
 *  2. supplies the type/accountID when the return params don't carry them.
 *
 * It is cleared the moment the consent resolves, and ignored once stale.
 */
import { isAaConsentType, type AaConsentType } from "../types/aa";

const KEY = "fs:aa:pending";
/** Consent handles are short-lived; stop trusting a marker after a day. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface PendingConsentJourney {
  type: AaConsentType;
  consentHandle: string;
  accountID: string;
  mobileNo: string;
  /** Epoch ms. */
  startedAt: number;
}

export function writePendingJourney(journey: PendingConsentJourney): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(journey));
  } catch {
    // Private mode / storage disabled — the return still works from the URL
    // params, it just can't tell itself apart from a mobile App Link return.
  }
}

export function readPendingJourney(): PendingConsentJourney | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PendingConsentJourney>;
    if (!isAaConsentType(parsed.type)) return null;
    if (typeof parsed.startedAt !== "number") return null;
    if (Date.now() - parsed.startedAt > MAX_AGE_MS) {
      clearPendingJourney();
      return null;
    }
    return {
      type: parsed.type,
      consentHandle: parsed.consentHandle ?? "",
      accountID: parsed.accountID ?? "",
      mobileNo: parsed.mobileNo ?? "",
      startedAt: parsed.startedAt,
    };
  } catch {
    clearPendingJourney();
    return null;
  }
}

export function clearPendingJourney(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to do — a stale marker times out on its own.
  }
}
