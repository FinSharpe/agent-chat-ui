/**
 * Domain-named wrappers over the generated Credits client
 * (`src/api/generated/credits-apis`, from finsharpe-agents `api/me_credits.py`,
 * #269).
 *
 * The generated fetchers resolve on every status, so a 401 or a 5xx would
 * reach react-query as data. These unwrap the `{data, status}` envelope and
 * throw `CreditsApiError` on anything but a 2xx — which is what lets a screen
 * tell a Balance that failed to load from a Balance of zero.
 *
 * Both routes read only the signed-in account; neither takes an account.
 */

import {
  meCreditHistoryApiMeCreditsHistoryGet,
  meCreditsApiMeCreditsGet,
} from "@/api/generated/credits-apis/me-credits/me-credits";
import type {
  MeCreditHistoryApiMeCreditsHistoryGetParams,
  UserCreditHistoryPage,
  UserCredits,
} from "@/api/generated/credits-apis/models";

export class CreditsApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "CreditsApiError";
  }
}

/** One History page. Below the server's ceiling of 100, so "Show older" is
 *  reached on an ordinary account rather than never. */
export const HISTORY_PAGE_SIZE = 30;

interface Envelope {
  data: unknown;
  status: number;
}

function unwrap<T>(envelope: Envelope): T {
  if (envelope.status >= 200 && envelope.status < 300) {
    return envelope.data as T;
  }
  const detail = (envelope.data as { detail?: unknown } | null)?.detail;
  throw new CreditsApiError(
    envelope.status,
    typeof detail === "string" ? detail : `Request failed (${envelope.status})`,
  );
}

export async function fetchCreditBalance(signal?: AbortSignal) {
  return unwrap<UserCredits>(await meCreditsApiMeCreditsGet({ signal }));
}

/**
 * One page, newest first. The first page is asked for with no cursor at all:
 * the generated URL builder would send a null as the string "null", which the
 * server rightly refuses as a cursor.
 */
export async function fetchCreditHistoryPage(
  cursor: string | null,
  signal?: AbortSignal,
) {
  const params: MeCreditHistoryApiMeCreditsHistoryGetParams = {
    limit: HISTORY_PAGE_SIZE,
    ...(cursor ? { cursor } : {}),
  };
  return unwrap<UserCreditHistoryPage>(
    await meCreditHistoryApiMeCreditsHistoryGet(params, { signal }),
  );
}
