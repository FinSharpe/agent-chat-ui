/**
 * What each research surface says when its query fails (T-10 item 3).
 *
 * Every screen here can fail in two different ways, and they are not the same
 * statement:
 *
 * - the server **answered** and refused — 404, 409, 422. That is a fact about
 *   this run, this report or this stock. Repeating the request repeats the
 *   answer, so those states say what the answer was and offer no retry.
 * - the server was **not reached** at all — a network error, or a 5xx. Nothing
 *   is known, least of all that the thing is missing. Those states say we
 *   could not load it and offer a retry that refetches.
 *
 * Keeping the two apart is the whole point: a dead backend must never read as
 * "you have no reports" or "this report does not exist".
 *
 * The copy is written for an investor — no status codes, no URLs, no server
 * `detail` strings pasted onto the screen. The detail stays in the thrown
 * `PipelineApiError` for the console.
 */

import { PipelineApiError } from "../api/pipelines-client";

export interface PipelineErrorCopy {
  title: string;
  description: string;
  /** False when the server answered clearly — a retry would only repeat it. */
  retryable: boolean;
}

/** The status the server answered with, or undefined if it never answered. */
function statusOf(error: unknown): number | undefined {
  return error instanceof PipelineApiError ? error.status : undefined;
}

/** True when the server answered and its answer was a refusal. */
export function isAnswered(error: unknown): boolean {
  const status = statusOf(error);
  return status !== undefined && status >= 400 && status < 500;
}

/** The line every "we could not reach the server" state ends on. */
const TRY_AGAIN = "Try again in a moment.";

export function quoteErrorCopy(
  error: unknown,
  symbol: string | null,
): PipelineErrorCopy {
  if (statusOf(error) === 404) {
    return {
      title: symbol
        ? `We don't recognise ${symbol}`
        : "We don't recognise that stock",
      description:
        "Search for the stock again and pick it from the list of matches.",
      retryable: false,
    };
  }
  if (isAnswered(error)) {
    return {
      title: "We couldn't price this run",
      description:
        "The server turned down the quote for this workflow. Nothing has been charged.",
      retryable: false,
    };
  }
  return {
    title: "Couldn't load the price for this run",
    description: `We couldn't reach the server, so the price and your balance aren't shown. Nothing has been charged. ${TRY_AGAIN}`,
    retryable: true,
  };
}

/**
 * The quote screen's other query: the catalog entry it prices.
 *
 * `error` is `undefined` when the catalog itself loaded and simply does not
 * hold this workflow — a real answer, and the only case that may say the
 * workflow is gone. A failed catalog says nothing about whether it exists.
 */
export function workflowErrorCopy(error: unknown): PipelineErrorCopy {
  if (error === undefined || error === null || isAnswered(error)) {
    return {
      title: "This workflow isn't available any more",
      description:
        "It has been taken out of the catalog. Pick another one from Agent Workflows.",
      retryable: false,
    };
  }
  return {
    title: "Couldn't load this workflow",
    description: `We couldn't reach the server, so there's nothing to price yet. Nothing has been charged. ${TRY_AGAIN}`,
    retryable: true,
  };
}

export function runErrorCopy(error: unknown): PipelineErrorCopy {
  if (statusOf(error) === 404) {
    return {
      title: "We can't find this run",
      description:
        "It isn't one of yours, or it has been removed. Everything you have commissioned is in Your Reports.",
      retryable: false,
    };
  }
  if (isAnswered(error)) {
    return {
      title: "We couldn't open this run",
      description:
        "The server wouldn't show us this run. Your reports are all in Your Reports.",
      retryable: false,
    };
  }
  return {
    title: "Couldn't load this run",
    description: `We couldn't reach the server. The run itself carries on without this screen — nothing is lost. ${TRY_AGAIN}`,
    retryable: true,
  };
}

export function reportErrorCopy(error: unknown): PipelineErrorCopy {
  const status = statusOf(error);
  if (status === 409) {
    return {
      title: "This report hasn't published yet",
      description:
        "The run is still working. It will be here, and in Your Reports, the moment it publishes.",
      retryable: true,
    };
  }
  if (status === 404) {
    return {
      title: "We can't find this report",
      description:
        "It isn't one of yours, or it has been removed. Everything you own is in Your Reports.",
      retryable: false,
    };
  }
  if (isAnswered(error)) {
    return {
      title: "We couldn't open this report",
      description: "The server wouldn't hand this report over just now.",
      retryable: false,
    };
  }
  return {
    title: "Couldn't load this report",
    description: `We couldn't reach the server. The report itself is frozen and safe. ${TRY_AGAIN}`,
    retryable: true,
  };
}

/**
 * The public share view, whose reader has no account and no way to check
 * anything themselves.
 *
 * Only 404 and 410 mean the link is dead. Anything else — including a failure
 * to reach the server at all — must not tell a visitor the report does not
 * exist, because that is the one thing we have not established.
 */
export function sharedReportIsGone(error: unknown): boolean {
  const status = statusOf(error);
  return status === 404 || status === 410;
}

export function sharedReportErrorCopy(error: unknown): PipelineErrorCopy {
  if (sharedReportIsGone(error)) {
    return {
      title: "This link is no longer active",
      description:
        "Whoever shared this report has revoked the link, or it never existed.",
      retryable: false,
    };
  }
  return {
    title: "We couldn't open this report",
    description: `The link is fine — we just couldn't reach the server. The report is still there. ${TRY_AGAIN}`,
    retryable: true,
  };
}
