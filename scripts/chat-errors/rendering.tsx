/**
 * The thread's error state as the chat draws it (finsharpe-agents#282): the
 * real `MessageList` over a stream holding the error `useStream` would hold.
 * A guardrail outage and the credits pause read "briefly unavailable" from
 * the class name alone, wherever the thread stopped; every other error keeps
 * the copy it had, chosen by position; the server's sentence is never shown.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ai, human, renderThread, textOf } from "../harness/chat-thread";

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

const SERVER_SENTENCE =
  "FinSharpe is briefly unavailable — try again in a minute.";
const UNAVAILABLE = [
  "FinSharpe is briefly unavailable",
  "Your question didn't go through this time. Try again in a minute.",
];
// Today's copy, word for word (stream-error.tsx before #282).
const SEND = [
  "Your message didn't get through",
  "We couldn't reach FinSharpe GPT just now. Nothing was lost — send it again in a moment.",
];
const INTERRUPTED = [
  "This answer stopped early",
  "The connection dropped before FinSharpe GPT finished. Retry to ask the same question again.",
];
const LOAD = [
  "We couldn't load this chat",
  "The connection to FinSharpe GPT dropped. Your chats are safe — try again in a moment.",
];

const named = (name: string, message = SERVER_SENTENCE) =>
  Object.assign(new Error(message), { name });

const QUESTION = human("h-1", "What is INFY's P/E ratio?");
const PARTIAL = ai("a-1", "INFY trades at");

/** Which state the thread draws, and what it says. */
function errorState(markup: string) {
  const variant = /data-stream-error="([^"]+)"/.exec(markup)?.[1] ?? null;
  const text = textOf(markup);
  const says = (copy: string[]) => copy.every((line) => text.includes(line));
  return {
    variant,
    unavailable: says(UNAVAILABLE),
    send: says(SEND),
    interrupted: says(INTERRUPTED),
    load: says(LOAD),
    retry: /<button[^>]*>.*?Retry<\/button>/.test(markup),
    serverSentence: text.includes(SERVER_SENTENCE),
  };
}

const drawnAs = (variant: string) => ({
  variant,
  unavailable: variant === "unavailable",
  send: variant === "send",
  interrupted: variant === "interrupted",
  load: variant === "load",
  retry: true,
  serverSentence: false,
});

/* -------------------------------------------------------------------------- */
/* The two classes: briefly unavailable                                        */
/* -------------------------------------------------------------------------- */

eq(
  errorState(
    renderThread({
      messages: [QUESTION],
      error: named("CreditsUnavailableError"),
    }),
  ),
  drawnAs("unavailable"),
  "the credits pause renders briefly unavailable, with Retry, not the server's sentence",
);
eq(
  errorState(
    renderThread({
      messages: [QUESTION],
      error: named("GuardrailUnavailableError"),
    }),
  ),
  drawnAs("unavailable"),
  "a guardrail outage renders the same state",
);
eq(
  errorState(
    renderThread({
      messages: [QUESTION, PARTIAL],
      error: named("CreditsUnavailableError"),
    }),
  ),
  drawnAs("unavailable"),
  "the class wins over position: never 'this answer stopped early'",
);
eq(
  errorState(
    renderThread({
      messages: [QUESTION],
      error: `CreditsUnavailableError('${SERVER_SENTENCE}')`,
    }),
  ),
  drawnAs("unavailable"),
  "a reopened chat whose last run paused renders it too",
);
eq(
  errorState(
    renderThread({
      messages: [QUESTION],
      error: {
        error: "GuardrailUnavailableError",
        message: SERVER_SENTENCE,
      },
    }),
  ),
  drawnAs("unavailable"),
  "a reopened chat whose last run hit an outage renders it too",
);

/* -------------------------------------------------------------------------- */
/* Every other error: today's copy, by position                               */
/* -------------------------------------------------------------------------- */

eq(
  errorState(
    renderThread({
      messages: [QUESTION],
      error: new TypeError("Failed to fetch"),
    }),
  ),
  drawnAs("send"),
  "a send that never connected keeps 'your message didn't get through'",
);
eq(
  errorState(
    renderThread({
      messages: [QUESTION, PARTIAL],
      error: named("GraphRecursionError", "Recursion limit of 25 reached"),
    }),
  ),
  drawnAs("interrupted"),
  "another class after a partial answer keeps 'this answer stopped early'",
);
eq(
  errorState(renderThread({ messages: [], loadFailed: true })),
  drawnAs("load"),
  "a chat that could not load keeps 'we couldn't load this chat'",
);
eq(
  errorState(
    renderThread({
      messages: [QUESTION],
      error: named("CreditsUnavailableError"),
      isLoading: true,
    }),
  ).variant,
  null,
  "nothing is drawn while a run is still going",
);
eq(
  errorState(renderThread({ messages: [QUESTION, ai("a-2", "INFY: 24.5x")] }))
    .variant,
  null,
  "an answered turn draws no error state",
);

// The toast beside it (`Thread`) says the same thing: its words come from the
// error, not from a fixed "the connection dropped".
const threadSource = readFileSync(
  join(process.cwd(), "src/components/thread/index.tsx"),
  "utf8",
);
eq(
  [
    /streamErrorToast\(stream\.error\)/.test(threadSource),
    threadSource.includes(
      "The connection dropped before the answer came through",
    ),
  ],
  [true, false],
  "the thread's toast is chosen from the error's class too",
);

if (failures > 0) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
