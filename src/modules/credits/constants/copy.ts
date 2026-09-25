/**
 * Every word the Credits surfaces say, in one place.
 *
 * The sentences are the owner's, settled in finsharpe-agents #223 and #231
 * (the credits preview on finsharpe-mobile `prototype/231-credits-screens`)
 * and restated by #279 / #280. finsharpe-mobile draws the same screen from the
 * same sentences, so a change here is a change there too.
 *
 * Users see credits and nothing else (B6): no copy here, and nothing any
 * Credits surface renders, may name a currency, a rate or a token count.
 */

export const CREDITS_TITLE = "Credits";

/** The word beside every figure. Always plural, as the charge label is. */
export const CREDITS_WORD = "credits";

/* -------------------------------------------------------------------------- */
/* The state line under the Balance                                           */
/* -------------------------------------------------------------------------- */

/** Below zero while nothing is refused (Shadow Mode, or not enforced). */
export const BELOW_ZERO_LINE = "Your balance is below zero.";

/** The Short Balance notice: `gated`, so the next chat turn is refused. */
export const SHORT_BALANCE_NOTICE =
  "Your credits are used up. Chat is paused until more are added.";

/* -------------------------------------------------------------------------- */
/* The Credit Request                                                          */
/* -------------------------------------------------------------------------- */

export const REQUEST_CREDITS = "Request credits";

export const CREDIT_REQUEST_SUBJECT = "FinSharpe credits request";

/** What the web says for "the platform and version" (#223 §5: "or: Web"). */
export const CREDIT_REQUEST_APP = "Web";

/* -------------------------------------------------------------------------- */
/* History                                                                     */
/* -------------------------------------------------------------------------- */

export const HISTORY_LABEL = "History";
export const BALANCE_LABEL = "Balance";
export const SHOW_OLDER = "Show older";

/** A chat row whose thread is not in this browser's list any more. */
export const CHAT_FALLBACK_TITLE = "Chat";

/** The row titles the server leaves to us only if it ever sends none. */
export const KIND_FALLBACK_TITLE = {
  purchase: "Report",
  allotment: "Credits added",
  refund: "Refund",
} as const;

/** How a turn that did not end normally is qualified (#223 §4). */
export const TERMINAL_STATUS_WORDS: Record<string, string> = {
  interrupted: "stopped",
  timeout: "timed out",
  error: "ended with an error",
};

export const WAIVED_WORD = "waived";
export const REFUNDED_WORD = "refunded";
/** The purchase row's qualifier in the preview: "Today · 11:20 · Report". */
export const REPORT_WORD = "Report";

export function mayAdjustUntil(when: string): string {
  return `may adjust until ${when}`;
}

export const HISTORY_EMPTY_TITLE = "Nothing here yet";
/**
 * Names no kind of row, so it holds in Shadow Mode (no chat turns in a
 * non-staff History) and after enforcement (chat turns too).
 */
export const HISTORY_EMPTY_BODY =
  "Credits added to your account and credits you use will be listed here.";

export const BALANCE_ERROR_TITLE = "Couldn't load your balance";
export const HISTORY_ERROR_TITLE = "Couldn't load your history";
export const OLDER_ERROR_TITLE = "Couldn't load older entries";

/* -------------------------------------------------------------------------- */
/* In chat (finsharpe-agents#282)                                              */
/* -------------------------------------------------------------------------- */

/**
 * The charge label's accessible name: what the figure under an answer is,
 * for a screen reader's links list. It contains the visible label.
 */
export function chargeLabelName(label: string): string {
  return `This answer used ${label}`;
}

/* -------------------------------------------------------------------------- */
/* The Pipeline quote (#229 copy, web)                                         */
/* -------------------------------------------------------------------------- */

/**
 * The web quote's short-balance line (plan Phase 5; #231 frame 8). It names
 * the Credits screen in words and carries no action and no link (ADR-0013).
 */
export function quoteShortfallSentence(shortfall: string): string {
  return `You need ${shortfall} credits more to commission this report. You can request more from the Credits screen.`;
}
