/**
 * A pin the list no longer carries (finsharpe-agents#255): the owner's
 * browser smoke, replayed against the real list client, query cache, stores
 * and gate. `GET /api/models` is answered by a stubbed `fetch`, as a DevTools
 * response override answers it, and nothing is reloaded between steps.
 *
 * - a thread is pinned while the model is listed, then the list is served
 *   without that row: the picker shows the pin under "No longer offered" by
 *   its last known label, and a send is held for the user's choice;
 * - a pin this browser never saw a label for is shown by its raw model id.
 */
import "./support/storage";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient } from "@tanstack/react-query";

import type { ChatModelOption } from "@/modules/chat/api/chatModels";
import {
  ModelChoiceList,
  ModelPill,
} from "@/modules/chat/components/ModelPickerParts";
import { useChatPrefsStore } from "@/modules/chat/store/useChatPrefsStore";
import { useModelChoiceStore } from "@/modules/chat/store/useModelChoiceStore";
import { chatModelGate } from "@/modules/chat/utils/chatModelGate";
import { createModelGate } from "@/modules/chat/utils/modelGate";
import {
  CHAT_MODELS_KEY,
  PIN_CONFIRM_MS,
  cachedModels,
  chatModelsQuery,
  refreshModels,
} from "@/modules/chat/utils/modelList";
import { isBlocked, pickerGroups, pinState } from "@/modules/chat/utils/pin";

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

const SONNET = "anthropic:claude-sonnet-5";
const GPT = "openai:gpt-5.4";
const row = (id: string, label: string): ChatModelOption => ({
  id,
  label,
  shortLabel: label,
  provider: id.split(":")[0],
  supportsImages: true,
  available: true,
});
const WITH = [row(SONNET, "Claude Sonnet 5"), row(GPT, "GPT-5.4")];
const WITHOUT = [row(GPT, "GPT-5.4")];

// The server, as the browser sees it: whatever the override serves now.
let served: ChatModelOption[] = WITH;
let reads = 0;
// Requests left to hang forever, ignoring their abort signal: the worst case.
let hangNext = 0;
globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input);
  if (!url.endsWith("/api/utilities/models")) {
    throw new Error(`unexpected fetch ${url}`);
  }
  reads++;
  if (hangNext > 0) {
    hangNext--;
    return new Promise<Response>(() => {});
  }
  return new Response(JSON.stringify({ models: served }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}) as typeof fetch;

const prefs = useChatPrefsStore.getState;
const choice = useModelChoiceStore.getState;
// gcTime Infinity: no garbage-collection timer keeps node alive.
const newClient = () =>
  new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });

/** Lets the stubbed read and the gate's confirmation run to completion. */
async function settle() {
  for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 1));
}

/** The pin and the picker as the composer would draw them now. */
function screen(queryClient: QueryClient) {
  const models = cachedModels(queryClient);
  const pin = pinState(prefs().model, models, prefs().labels);
  const groups = pickerGroups(models ?? [], pin);
  const list = renderToStaticMarkup(
    <ModelChoiceList
      pin={pin}
      groups={groups}
      waiting={choice().held !== null}
      onChoose={() => {}}
    />,
  );
  const pill = renderToStaticMarkup(
    <ModelPill
      pin={pin}
      open={false}
      compact={false}
    />,
  );
  return { pin, groups, list, pill };
}

/** Ages the cached list, as if it was read that long ago. */
function age(queryClient: QueryClient, ms: number) {
  queryClient.setQueryData(CHAT_MODELS_KEY, cachedModels(queryClient), {
    updatedAt: Date.now() - ms,
  });
}

const sent: (string | null)[] = [];
const send = (model: string | null) => void sent.push(model);

async function ownersSequence() {
  // The page loads with the model listed, and the thread is pinned to it.
  served = WITH;
  const queryClient = newClient();
  await queryClient.fetchQuery(chatModelsQuery());
  prefs().rememberLabels(cachedModels(queryClient) ?? []);
  prefs().openThread("t1");
  prefs().pick(SONNET, "t1");
  eq(
    screen(queryClient).pin,
    {
      kind: "pinned",
      id: SONNET,
      label: "Claude Sonnet 5",
      shortLabel: "Claude Sonnet 5",
      status: "available",
    },
    "owner: the thread is pinned while the model is listed",
  );

  // The list is now served without that row. No reload.
  served = WITHOUT;

  // The user opens the picker: it reads the list again (ModelPicker).
  const before = reads;
  await refreshModels(queryClient);
  eq(reads - before, 1, "owner: opening the picker re-reads the list");
  let view = screen(queryClient);
  eq(
    view.pin.kind === "pinned" && view.pin.status,
    "unlisted",
    "owner: the pin is unlisted",
  );
  eq(
    view.groups[view.groups.length - 1],
    [
      "No longer offered",
      [{ id: SONNET, label: "Claude Sonnet 5", choosable: false }],
    ],
    "owner: the pin is under No longer offered, by its last known label",
  );
  eq(
    view.groups.some(([provider]) => provider === "anthropic"),
    false,
    "owner: and not as an ordinary row under its provider",
  );
  eq(
    view.list.includes("No longer offered") &&
      view.list.includes("Claude Sonnet 5") &&
      view.list.includes("Unavailable"),
    true,
    "owner: the popover draws it there, marked Unavailable",
  );
  eq(
    view.pill.includes("Claude Sonnet 5") &&
      view.pill.includes("(unavailable)"),
    true,
    "owner: the pill keeps the name, marked unavailable",
  );
  eq(prefs().threads.t1, SONNET, "owner: the pin itself is untouched");

  // A send now is held; nothing goes out, pinned or on Auto.
  const gate = chatModelGate(queryClient, () => "t1");
  sent.length = 0;
  gate(send);
  await settle();
  eq(sent, [], "owner: a send on the unlisted pin sends nothing");
  eq(choice().held !== null, true, "owner: it is held for the user's choice");
  choice().cancel();

  // The same, without opening the picker first: the page's list is a while
  // old, and the server dropped the row since it was read.
  served = WITH;
  await refreshModels(queryClient);
  served = WITHOUT;
  age(queryClient, PIN_CONFIRM_MS + 1000);
  eq(
    screen(queryClient).pin.kind === "pinned" &&
      (screen(queryClient).pin as { status: string }).status,
    "available",
    "owner: the stale list still shows the pin as offered",
  );
  sent.length = 0;
  eq(
    gate(send),
    false,
    "owner: a pinned send on a stale list waits for a re-read",
  );
  await settle();
  eq(sent, [], "owner: the re-read finds the row gone and nothing is sent");
  eq(
    choice().held !== null,
    true,
    "owner: the send is held for the user's choice",
  );
  view = screen(queryClient);
  eq(
    view.groups[view.groups.length - 1]?.[0],
    "No longer offered",
    "owner: and the picker it opens shows the pin under No longer offered",
  );
  choice().cancel();

  // A second press while the re-read is in flight does not send twice.
  served = WITH;
  age(queryClient, PIN_CONFIRM_MS + 1000);
  sent.length = 0;
  gate(send);
  gate(send);
  await settle();
  eq(sent, [SONNET], "owner: two presses on a stale list send once");

  // The row comes back: the same pin sends, with no action from the user.
  served = WITH;
  age(queryClient, PIN_CONFIRM_MS + 1000);
  sent.length = 0;
  gate(send);
  await settle();
  eq(sent, [SONNET], "owner: listed again, the same pin sends pinned");
  eq(choice().held, null, "owner: with nothing held");

  // Opening another chat meanwhile drops a send still being confirmed.
  served = WITHOUT;
  age(queryClient, PIN_CONFIRM_MS + 1000);
  let scope = "t1";
  let dropped = 0;
  const scoped = chatModelGate(queryClient, () => scope);
  sent.length = 0;
  scoped(send, () => void dropped++);
  scope = "t2";
  await settle();
  eq(
    [sent, dropped, choice().held],
    [[], 1, null],
    "owner: a send confirmed after the user left the chat is dropped",
  );
  queryClient.clear();
}

async function pinWithNoLabel() {
  // A pin stored by a build before labels were remembered.
  useChatPrefsStore.setState({
    model: null,
    last: null,
    threads: {},
    labels: {},
  });
  localStorage.setItem(
    "chat-model-prefs",
    JSON.stringify({
      state: { last: SONNET, threads: { t9: SONNET } },
      version: 0,
    }),
  );
  await useChatPrefsStore.persist.rehydrate();
  eq(prefs().labels[SONNET], undefined, "no label: none was ever stored");

  // The first list this browser sees does not carry it.
  served = WITHOUT;
  const queryClient = newClient();
  await queryClient.fetchQuery(chatModelsQuery());
  prefs().rememberLabels(cachedModels(queryClient) ?? []);
  prefs().openThread("t9");
  const view = screen(queryClient);
  eq(
    view.pin,
    {
      kind: "pinned",
      id: SONNET,
      label: SONNET,
      shortLabel: SONNET,
      status: "unlisted",
    },
    "no label: the pin is shown by its raw model id, unlisted",
  );
  eq(
    view.groups[view.groups.length - 1],
    ["No longer offered", [{ id: SONNET, label: SONNET, choosable: false }]],
    "no label: it is under No longer offered by its raw id",
  );
  eq(
    view.list.includes("No longer offered") && view.list.includes(SONNET),
    true,
    "no label: the popover draws it there",
  );
  eq(
    view.pill.includes(SONNET) && view.pill.includes("(unavailable)"),
    true,
    "no label: the pill names the raw id, marked unavailable",
  );
  eq(isBlocked(view.pin), true, "no label: the pin blocks a send");

  const gate = chatModelGate(queryClient, () => "t9");
  sent.length = 0;
  gate(send);
  await settle();
  eq(sent, [], "no label: a send goes out on nothing");
  eq(
    choice().held !== null,
    true,
    "no label: it is held for the user's choice",
  );
  prefs().pick(null, "t9");
  choice().chosen();
  eq(sent, [null], "no label: choosing Auto sends it on Auto");
  queryClient.clear();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function hungRead() {
  // The list answered once; the chat is pinned to a model on it.
  served = WITH;
  const queryClient = newClient();
  await queryClient.fetchQuery(chatModelsQuery());
  useChatPrefsStore.setState({ model: SONNET });

  // The next request hangs. The server has since dropped the row.
  hangNext = 1;
  served = WITHOUT;
  let before = reads;
  let started = Date.now();
  const first = await refreshModels(queryClient, { timeoutMs: 50 });
  eq(reads - before, 1, "hung: the first refresh sends one request");
  eq(Date.now() - started < 1000, true, "hung: it gives up at the cap");
  eq(
    first?.map((m) => m.id),
    [SONNET, GPT],
    "hung: the last good list stands",
  );
  eq(
    queryClient.getQueryState(CHAT_MODELS_KEY)?.fetchStatus,
    "idle",
    "hung: the stuck request is cancelled, not left in flight",
  );

  before = reads;
  started = Date.now();
  const second = await refreshModels(queryClient, { timeoutMs: 2000 });
  eq(reads - before, 1, "hung: the next refresh issues a new request");
  eq(
    second?.map((m) => m.id),
    [GPT],
    "hung: and gets the fresh list, without waiting out the cap",
  );
  eq(
    Date.now() - started < 1000,
    true,
    "hung: it answered well before the cap",
  );

  // A pinned send whose confirmation hangs still goes out pinned, never Auto.
  served = WITH;
  await refreshModels(queryClient);
  hangNext = 1;
  const gate = createModelGate({
    getModel: () => prefs().model,
    getModels: () => cachedModels(queryClient),
    hold: (send) => choice().hold(send),
    needsConfirm: () => true,
    confirm: () => refreshModels(queryClient, { timeoutMs: 50 }),
  });
  sent.length = 0;
  gate(send);
  await sleep(200);
  eq(sent, [SONNET], "hung: a send past the cap goes out pinned, not on Auto");
  eq(choice().held, null, "hung: and is not held");
  hangNext = 0;
  queryClient.clear();
}

(async () => {
  await ownersSequence();
  await pinWithNoLabel();
  await hungRead();
  if (failures > 0) {
    console.log(`\n${failures} failure(s)`);
    process.exit(1);
  }
  console.log("\nall passed");
  process.exit(0);
})();
