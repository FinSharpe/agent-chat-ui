/**
 * The thread's error state keyed on the exception's class name
 * (finsharpe-agents#282). The runtime ends a Run in error with the SSE frame
 * `{"error": <class name>, "message": <str(exc)>}`; the class name is the code.
 *
 * - `GuardrailUnavailableError` (agents `middleware/input_guardrail.py`, #207)
 *   and `CreditsUnavailableError` (agents `services/credits/admission.py`,
 *   #262/#268 — the pause) are "briefly unavailable", wherever the thread
 *   stopped;
 * - every other error keeps today's copy, chosen by position.
 *
 * The frames are driven through the real SDK — `Client.runs.stream` parsing
 * the bytes, `useStream` turning the frame into its error — so what is checked
 * is what the chat's `stream.error` holds. And the three shapes a reopened
 * chat's last task error can take are read too.
 */

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Client } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";

import {
  BRIEFLY_UNAVAILABLE_BODY,
  BRIEFLY_UNAVAILABLE_HEADING,
  BRIEFLY_UNAVAILABLE_TOAST,
  RUN_FAILED_TOAST,
  errorClassOf,
  isBrieflyUnavailable,
  streamErrorToast,
  streamErrorVariant,
} from "@/lib/stream-error";

let failures = 0;
function eq(actual: unknown, expected: unknown, name: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${name}\n  got:      ${a}\n  expected: ${e}`);
  } else {
    console.log(`ok   ${name}`);
  }
}

/** The agents' own sentence for both classes, pinned by their tests
 *  (`tests/middleware/test_short_balance.py`: `str(error) == …`). */
const SERVER_SENTENCE =
  "FinSharpe is briefly unavailable — try again in a minute.";
const PAUSE = { error: "CreditsUnavailableError", message: SERVER_SENTENCE };
const OUTAGE = { error: "GuardrailUnavailableError", message: SERVER_SENTENCE };

const HUMAN = { type: "human" };
const AI = { type: "ai" };

/* -------------------------------------------------------------------------- */
/* The class name, in every shape it reaches the thread                        */
/* -------------------------------------------------------------------------- */

// What the SDK's StreamError is: an Error named after the frame's `error`.
const named = (name: string, message = SERVER_SENTENCE) =>
  Object.assign(new Error(message), { name });

eq(
  [
    errorClassOf(named("CreditsUnavailableError")),
    errorClassOf(named("GuardrailUnavailableError")),
  ],
  ["CreditsUnavailableError", "GuardrailUnavailableError"],
  "a live run: the error's name is the class",
);
eq(
  [errorClassOf(PAUSE), errorClassOf(OUTAGE)],
  ["CreditsUnavailableError", "GuardrailUnavailableError"],
  "a reopened chat, the frame's object: its `error` is the class",
);
eq(
  errorClassOf(JSON.stringify(PAUSE)),
  "CreditsUnavailableError",
  "a reopened chat, the frame as a JSON string",
);
// The checkpoint stores a task's exception as `repr(exc)` (langgraph
// `checkpoint/serde/jsonplus.py`), and the SDK hands a string it cannot
// parse through as it is.
eq(
  [
    errorClassOf(`CreditsUnavailableError('${SERVER_SENTENCE}')`),
    errorClassOf(`GuardrailUnavailableError('${SERVER_SENTENCE}')`),
    errorClassOf(`CreditsUnavailableError: ${SERVER_SENTENCE}`),
  ],
  [
    "CreditsUnavailableError",
    "GuardrailUnavailableError",
    "CreditsUnavailableError",
  ],
  "a reopened chat, the checkpoint's repr of the exception",
);
eq(
  [
    errorClassOf(undefined),
    errorClassOf(null),
    errorClassOf(42),
    errorClassOf("Failed to fetch"),
    errorClassOf("The connection dropped"),
    errorClassOf({ message: "no class" }),
    errorClassOf(new TypeError("Failed to fetch")),
  ],
  [null, null, null, null, null, null, "TypeError"],
  "text with no class in front of it names none",
);

/* -------------------------------------------------------------------------- */
/* The variant                                                                 */
/* -------------------------------------------------------------------------- */

for (const [label, error] of [
  ["the pause", named("CreditsUnavailableError")],
  ["a guardrail outage", named("GuardrailUnavailableError")],
  ["the pause, reopened", `CreditsUnavailableError('${SERVER_SENTENCE}')`],
  ["an outage, reopened", OUTAGE],
] as const) {
  eq(
    [
      streamErrorVariant(error, HUMAN),
      streamErrorVariant(error, AI),
      streamErrorVariant(error, undefined),
    ],
    ["unavailable", "unavailable", "unavailable"],
    `${label} is briefly unavailable wherever the thread stopped`,
  );
}

for (const [label, error] of [
  ["a fetch that never connected", new TypeError("Failed to fetch")],
  ["another class the runtime named", named("GraphRecursionError", "…")],
  ["a runtime fault", named("KeyError", "An internal error occurred")],
  ["the SDK's unnamed StreamError", named("StreamError", "boom")],
  ["a Short Balance, were it ever raised", named("ShortBalanceRefusal")],
  ["a near miss", named("CreditsUnavailable")],
  ["a lower-case spelling", named("creditsunavailableerror")],
] as const) {
  eq(
    [
      streamErrorVariant(error, HUMAN),
      streamErrorVariant(error, AI),
      streamErrorVariant(error, undefined),
    ],
    ["send", "interrupted", "load"],
    `${label} keeps today's copy, chosen by position`,
  );
}
eq(
  [
    isBrieflyUnavailable(named("GuardrailUnavailableError")),
    isBrieflyUnavailable(named("CreditsUnavailableError")),
    isBrieflyUnavailable(named("InFlightCapRefusal")),
    isBrieflyUnavailable(undefined),
  ],
  [true, true, false, false],
  "exactly the two classes are an outage",
);
eq(
  streamErrorVariant(undefined, undefined),
  "load",
  "a chat that never loaded, with no error, is still the load state",
);

/* -------------------------------------------------------------------------- */
/* The toast                                                                   */
/* -------------------------------------------------------------------------- */

eq(
  RUN_FAILED_TOAST,
  {
    title: "FinSharpe GPT couldn't answer that",
    description:
      "The connection dropped before the answer came through. Use Retry in the chat to send it again.",
  },
  "the toast for every other error is today's, word for word",
);
eq(
  [
    streamErrorToast(named("CreditsUnavailableError")),
    streamErrorToast(OUTAGE),
    streamErrorToast(new TypeError("Failed to fetch")),
  ],
  [BRIEFLY_UNAVAILABLE_TOAST, BRIEFLY_UNAVAILABLE_TOAST, RUN_FAILED_TOAST],
  "an outage or the pause toasts that, not a dropped connection",
);
eq(
  BRIEFLY_UNAVAILABLE_TOAST.title,
  BRIEFLY_UNAVAILABLE_HEADING,
  "the toast and the thread say the same heading",
);
// finsharpe-mobile `lib/core/copy.dart`: `SharedCopy.serviceBrieflyUnavailable`
// (#281). The two clients say this heading word for word; the body line and
// the toast's description are the web's own and stay as they were.
eq(
  [
    BRIEFLY_UNAVAILABLE_HEADING,
    BRIEFLY_UNAVAILABLE_BODY,
    BRIEFLY_UNAVAILABLE_TOAST.description,
  ],
  [
    "FinSharpe is briefly unavailable.",
    "Your question didn't go through this time. Try again in a minute.",
    "Use Retry in the chat to ask again in a minute.",
  ],
  "the heading is mobile's shared copy word for word, full stop included; the body and toast line are the web's",
);

// Server text is never copy: nothing the client says is the frame's message.
eq(
  [
    BRIEFLY_UNAVAILABLE_HEADING,
    BRIEFLY_UNAVAILABLE_BODY,
    BRIEFLY_UNAVAILABLE_TOAST.description,
  ].filter((line) => line === SERVER_SENTENCE || /Error\b/.test(line)),
  [],
  "the copy is the client's own and names no class",
);

/* -------------------------------------------------------------------------- */
/* Through the real SDK: bytes on the wire → `useStream`'s error               */
/* -------------------------------------------------------------------------- */

const encoder = new TextEncoder();

/** A LangGraph runtime that ends every run with `frame` as its error event. */
function runtimeEndingWith(frame: unknown) {
  const requests: string[] = [];
  const fetch = async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    requests.push(url.replace(/^https?:\/\/[^/]+/, ""));
    if (url.endsWith("/runs/stream")) {
      const body =
        `event: metadata\ndata: ${JSON.stringify({ run_id: "run-1" })}\n\n` +
        `event: error\ndata: ${JSON.stringify(frame)}\n\n`;
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(body));
            controller.close();
          },
        }),
        { status: 200, headers: { "Content-Type": "text/event-stream" } },
      );
    }
    if (url.endsWith("/history")) {
      return new Response("[]", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw new Error(`unexpected request ${url}`);
  };
  const client = new Client({
    apiUrl: "http://agents.test",
    apiKey: "test-no-key",
    callerOptions: { fetch, maxRetries: 0 },
  });
  return { client, requests };
}

/** Sends one turn through `useStream`; returns the error it reported and
 *  the requests it made. The SDK logs the error it reports; that is muted. */
async function runError(
  frame: unknown,
): Promise<{ error: unknown; requests: string[] }> {
  const { client, requests } = runtimeEndingWith(frame);
  const log = console.error;
  console.error = () => {};
  try {
    const error = await new Promise<unknown>((resolve, reject) => {
      let submit: ((values: unknown) => Promise<void>) | null = null;
      function Probe() {
        const stream = useStream({
          client,
          assistantId: "agent",
          threadId: "thread-1",
          onError: resolve,
          onFinish: () =>
            reject(new Error("the run finished without an error")),
        });
        submit = stream.submit as (values: unknown) => Promise<void>;
        return null;
      }
      renderToStaticMarkup(React.createElement(Probe));
      if (!submit) {
        reject(new Error("useStream did not mount"));
        return;
      }
      void (submit as (values: unknown) => Promise<void>)({
        messages: [{ type: "human", content: "What is INFY's P/E?" }],
      });
    });
    return { error, requests };
  } finally {
    console.error = log;
  }
}

async function throughTheSdk() {
  const { error: paused, requests } = await runError(PAUSE);
  eq(
    requests,
    ["/threads/thread-1/runs/stream", "/threads/thread-1/history"],
    "the turn went to the runtime, which answered with an error frame",
  );
  eq(
    [
      paused instanceof Error,
      (paused as Error).name,
      (paused as Error).message,
    ],
    [true, "CreditsUnavailableError", SERVER_SENTENCE],
    "the SDK names the pause's error after the frame's class",
  );
  eq(
    [streamErrorVariant(paused, HUMAN), streamErrorToast(paused).title],
    ["unavailable", BRIEFLY_UNAVAILABLE_HEADING],
    "and the thread renders it briefly unavailable",
  );

  const { error: outage } = await runError(OUTAGE);
  eq(
    [(outage as Error).name, streamErrorVariant(outage, HUMAN)],
    ["GuardrailUnavailableError", "unavailable"],
    "a guardrail outage through the SDK is briefly unavailable too",
  );

  const { error: other } = await runError({
    error: "GraphRecursionError",
    message: "Recursion limit of 25 reached without hitting a stop condition.",
  });
  eq(
    [(other as Error).name, streamErrorVariant(other, HUMAN)],
    ["GraphRecursionError", "send"],
    "any other class through the SDK keeps today's copy",
  );

  const { error: internal } = await runError({
    error: "KeyError",
    message: "An internal error occurred",
  });
  eq(
    [streamErrorVariant(internal, AI), streamErrorToast(internal)],
    ["interrupted", RUN_FAILED_TOAST],
    "a runtime fault keeps today's copy and toast",
  );
}

throughTheSdk()
  .catch((error) => {
    failures++;
    console.log(`FAIL the SDK run did not complete\n  ${String(error)}`);
  })
  .finally(() => {
    if (failures > 0) {
      console.log(`\n${failures} failure(s)`);
      process.exit(1);
    }
  });
