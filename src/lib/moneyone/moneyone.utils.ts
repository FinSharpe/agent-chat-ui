import isEmpty from "lodash/isEmpty";

export function getErrMsgKey(e: unknown, key: string) {
  return typeof e === "object" &&
    !isEmpty(e) &&
    key in e &&
    typeof e[key] === "string"
    ? e[key]
    : null;
}

/**
 * Extract a meaningful error message from an unknown error object.
 * Checks multiple common error message fields used by MoneyOne and other APIs.
 */
export function extractErrorMessage(e: unknown): string | null {
  if (typeof e !== "object" || isEmpty(e)) return null;

  const fields = ["errorMsg", "message", "error", "detail", "error_description"];
  for (const field of fields) {
    const value = getErrMsgKey(e, field);
    if (value) return value;
  }

  return null;
}

/**
 * How an FI-data / FI-request failure should be handled:
 * - `consent-dead`  → consent is expired/revoked/gone. Only fix is delete +
 *                     re-consent. Refreshing the same consent will keep failing.
 * - `data-missing`  → consent is valid but FinPro holds no data (never fetched,
 *                     or purged after retention). Fix is to re-fetch via
 *                     `/fi/request` (the Refresh flow).
 * - `transient`     → network/server hiccup; retry.
 */
export type FiDataErrorKind = "consent-dead" | "data-missing" | "transient";

/**
 * FinPro error codes (and FP0xxx status codes) for a permanently dead consent.
 * Source: Get All FI Data error catalogue in the FinPro Postman collection.
 *   FP0034 InvalidConsentId  — "Consent ID does not exist."
 *   FP0058 InvalidRequest    — "Consent ID is Revoked…"
 */
const CONSENT_DEAD_CODES = new Set<string>([
  "InvalidConsentId",
  "FP0034",
  "FP0058",
  "ConsentExpired",
  "ConsentRevoked",
  "ConsentNotActive",
  "ConsentNotFound",
  "ConsentRejected",
  "NoConsent",
]);

/**
 * FinPro error codes for "consent valid, but no data to serve" — recoverable
 * by triggering a fresh FI fetch. Source: same catalogue.
 *   FP0060 NoDataAvailable — "Data is not available for the given consent"
 *   FP0061 DataIsDeleted   — "Data is deleted for this consent"
 *   FP0063 NoDataFound     — "Data is not available"
 */
const DATA_MISSING_CODES = new Set<string>([
  "NoDataAvailable",
  "FP0060",
  "DataIsDeleted",
  "FP0061",
  "NoDataFound",
  "FP0063",
]);

/**
 * Classify an FI-data failure from its MoneyOne errorCode/errorMsg. Matches by
 * known code first, then falls back to a message heuristic.
 */
export function classifyFiDataError(
  errorCode?: string | null,
  errorMsg?: string | null,
): FiDataErrorKind {
  if (errorCode) {
    if (CONSENT_DEAD_CODES.has(errorCode)) return "consent-dead";
    if (DATA_MISSING_CODES.has(errorCode)) return "data-missing";
  }

  const msg = (errorMsg ?? "").toLowerCase();
  if (
    msg.includes("consent") &&
    /(expire|revok|does not exist|not exist|inactive|not active|rejected|no longer)/.test(
      msg,
    )
  ) {
    return "consent-dead";
  }
  if (
    /data is (not available|deleted)|not available for the given consent|no data|data not ready/.test(
      msg,
    )
  ) {
    return "data-missing";
  }

  return "transient";
}

/**
 * Convenience: is this failure a dead consent (the only case that should flip
 * the card into the "Expired" state and stop refresh polling)?
 */
export function isConsentInvalidError(
  errorCode?: string | null,
  errorMsg?: string | null,
): boolean {
  return classifyFiDataError(errorCode, errorMsg) === "consent-dead";
}
