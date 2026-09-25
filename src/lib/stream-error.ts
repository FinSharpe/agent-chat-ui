/**
 * Which failure a run's error is, for the thread's error state and its toast
 * (finsharpe-agents#282).
 *
 * The agents end a Run in error, rather than answer it, when they could not
 * take the turn at all. The runtime's SSE error frame is `{"error": <exception
 * class name>, "message": <str(exception)>}`, and the SDK's `useStream` turns it
 * into an `Error` whose `name` is that class name. So the class name is the
 * stable code, and it is the only thing read here: **server text is never
 * copy** (finsharpe-mobile#81 reads the frame the same way).
 *
 * Two classes mean "FinSharpe is briefly unavailable", and are rendered alike:
 *
 * - `GuardrailUnavailableError` — the input guardrail's classifier could not
 *   judge the turn (agents #207, `middleware/input_guardrail.py`);
 * - `CreditsUnavailableError` — the pause: Admission could not record the turn,
 *   or in enforced mode could not read the Balance (agents #262 / #268,
 *   `services/credits/admission.py`). Never a Short Balance — that one is an
 *   answer with a `credits` carrier, not an error.
 *
 * Each name is a wire contract with finsharpe-agents: renaming the class there
 * sends that failure back to the generic copy here. Every other error keeps the
 * copy chosen by where the thread stopped, as before.
 *
 * Kept free of React so the checks can import it.
 */

/** The classifier could not judge the turn (agents #207). */
export const GUARDRAIL_UNAVAILABLE_ERROR = "GuardrailUnavailableError";

/** The pause: Admission could not record the turn (agents #262, #268). */
export const CREDITS_UNAVAILABLE_ERROR = "CreditsUnavailableError";

/** The class names the thread renders as "briefly unavailable". */
export const BRIEFLY_UNAVAILABLE_ERRORS: ReadonlySet<string> = new Set([
  GUARDRAIL_UNAVAILABLE_ERROR,
  CREDITS_UNAVAILABLE_ERROR,
]);

export type StreamErrorVariant =
  /** The message never reached the assistant: nothing came back at all. */
  | "send"
  /** An answer had started and the connection dropped part-way through. */
  | "interrupted"
  /** The conversation itself could not be loaded. */
  | "load"
  /** The agents could not take the turn just now: an outage or the pause. */
  | "unavailable";

/** A bare class name at the start of a Python repr or a traceback line:
 *  `CreditsUnavailableError('…')`, `CreditsUnavailableError: …`. */
const LEADING_CLASS = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*(?:\(|:|$)/;

/**
 * The exception class the runtime named for a failed run, or null.
 *
 * Three shapes reach the thread, and all three are read:
 *
 * - a live run: the SDK's `StreamError`, whose `name` is the frame's `error`;
 * - a reopened chat whose last run failed: the thread's last task error, which
 *   the SDK passes on as it finds it — the frame's object, a JSON string of
 *   it, or the checkpoint's `repr()` of the exception (`Name('…')`);
 * - anything else (a fetch that never connected) names no class the agents
 *   raise, and so maps to nothing here.
 */
export function errorClassOf(error: unknown): string | null {
  if (error == null) return null;
  if (typeof error === "string") {
    const trimmed = error.trim();
    if (trimmed.startsWith("{")) {
      try {
        return errorClassOf(JSON.parse(trimmed));
      } catch {
        // Not JSON: read it as a repr below.
      }
    }
    return LEADING_CLASS.exec(trimmed)?.[1] ?? null;
  }
  if (typeof error !== "object") return null;
  if (error instanceof Error) {
    return error.name ? error.name : null;
  }
  const record = error as Record<string, unknown>;
  for (const key of ["error", "name"] as const) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/** Whether the run ended because the agents could not take the turn now. */
export function isBrieflyUnavailable(error: unknown): boolean {
  const name = errorClassOf(error);
  return name !== null && BRIEFLY_UNAVAILABLE_ERRORS.has(name);
}

/**
 * Which failure the reader is looking at. A class the agents raise for an
 * outage or the pause is "unavailable", wherever the thread stopped; any other
 * error keeps today's choice by position — nothing came back at all, an answer
 * was cut off part-way, or the conversation never loaded.
 */
export function streamErrorVariant(
  error: unknown,
  last: { type: string } | undefined,
): StreamErrorVariant {
  if (isBrieflyUnavailable(error)) return "unavailable";
  if (!last) return "load";
  return last.type === "human" ? "send" : "interrupted";
}

/* -------------------------------------------------------------------------- */
/* Copy                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The "briefly unavailable" state. The heading is finsharpe-mobile's
 * `SharedCopy.serviceBrieflyUnavailable` (`lib/core/copy.dart`) word for word,
 * full stop included — the line both clients show for these two classes, so
 * change the two together. The agents' own sentence ("FinSharpe is briefly
 * unavailable — try again in a minute.") says the same and is never rendered
 * from the wire. The body line and the toast's description are the web's own.
 */
export const BRIEFLY_UNAVAILABLE_HEADING = "FinSharpe is briefly unavailable.";
export const BRIEFLY_UNAVAILABLE_BODY =
  "Your question didn't go through this time. Try again in a minute.";

/** The toast that makes sure a failure is noticed when scrolled away. */
export interface StreamErrorToast {
  title: string;
  description: string;
}

/** Today's toast, for every error the agents did not name as an outage. */
export const RUN_FAILED_TOAST: StreamErrorToast = {
  title: "FinSharpe GPT couldn't answer that",
  description:
    "The connection dropped before the answer came through. Use Retry in the chat to send it again.",
};

export const BRIEFLY_UNAVAILABLE_TOAST: StreamErrorToast = {
  title: BRIEFLY_UNAVAILABLE_HEADING,
  description: "Use Retry in the chat to ask again in a minute.",
};

/** The toast for `error`: the outage's words for the two classes, else today's. */
export function streamErrorToast(error: unknown): StreamErrorToast {
  return isBrieflyUnavailable(error)
    ? BRIEFLY_UNAVAILABLE_TOAST
    : RUN_FAILED_TOAST;
}
