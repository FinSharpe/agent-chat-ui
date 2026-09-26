"use client";

import { useMutation } from "@tanstack/react-query";
import { clearBrowserCopies } from "@/lib/browser-copies";
import { extractApiError } from "@/modules/auth/utils/extract-api-error";
import { DELETE_ACCOUNT_PATH, SUPPORT_EMAIL } from "../constants/content";

/** A deletion that did not happen. The account still exists. */
export class DeleteAccountError extends Error {
  constructor(
    message: string,
    /** HTTP status, or `null` when the request never got an answer. */
    readonly status: number | null,
  ) {
    super(message);
    this.name = "DeleteAccountError";
  }
}

function messageFor(status: number, data: unknown): string {
  if (status === 401) {
    return "Your session has ended. Sign in again to delete your account.";
  }
  if (status === 409) {
    // ADMIN, or an account an institution manages (its KYC and client book).
    return extractApiError(
      data,
      `This account can't be deleted here. Email ${SUPPORT_EMAIL} and we will help.`,
    );
  }
  // 502 (MoneyOne) and 503 (threads) carry their own "not deleted; try again".
  return extractApiError(
    data,
    "Something went wrong. Your account was not deleted; try again.",
  );
}

async function deleteAccount(): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/auth/me", { method: "DELETE" });
  } catch {
    throw new DeleteAccountError(
      "We couldn't reach FinSharpe. Your account still exists; try again.",
      null,
    );
  }
  if (response.status === 204) return;

  const data = await response.json().catch(() => null);
  throw new DeleteAccountError(
    messageFor(response.status, data),
    response.status,
  );
}

/**
 * What this browser kept about the user's connections — the copy of connected
 * financial data and the old consent records — goes whatever the request did,
 * so a deletion that fails part-way, or whose answer never arrives, still
 * leaves none of it behind here.
 */
async function deleteAccountAndClearCopies(): Promise<void> {
  try {
    await deleteAccount();
  } finally {
    await clearBrowserCopies();
  }
}

/** Forget what this browser kept for the account. Storage may be blocked. */
function clearBrowserStorage() {
  try {
    window.localStorage.clear();
  } catch {
    // Nothing to clear.
  }
  try {
    window.sessionStorage.clear();
  } catch {
    // Nothing to clear.
  }
}

/**
 * Deletes the signed-in account through the BFF, which also clears the session
 * cookies. The persisted query cache and the old consent records are cleared
 * on every outcome; on success local and session storage are cleared too and
 * the page reloads into its "deleted" state, so no in-memory user or query
 * cache outlives the account.
 */
export function useDeleteAccountMutation() {
  return useMutation<void, DeleteAccountError>({
    mutationFn: deleteAccountAndClearCopies,
    onSuccess: () => {
      clearBrowserStorage();
      window.location.replace(`${DELETE_ACCOUNT_PATH}?deleted=1`);
    },
  });
}
