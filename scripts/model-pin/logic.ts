/**
 * An unavailable pinned model waits for the user's choice
 * (finsharpe-agents#255, ADR-0015). The rules:
 *
 * - a pin the list marks unavailable, or no longer lists, stays the pin and
 *   is shown by its last known label, marked unavailable;
 * - a send on it goes out on nothing — never on Auto — until the user
 *   chooses another model or Auto, and then goes out on that choice;
 * - nothing moves a pin to Auto on the server's say-so;
 * - when the model is available again the same pin sends, with no action.
 */
import "./support/storage";

import type { ChatModelOption } from "@/modules/chat/api/chatModels";
import { useChatPrefsStore } from "@/modules/chat/store/useChatPrefsStore";
import { useModelChoiceStore } from "@/modules/chat/store/useModelChoiceStore";
import { createModelGate } from "@/modules/chat/utils/modelGate";
import {
  fallbackLabel,
  isBlocked,
  pickerGroups,
  pinState,
  runPin,
} from "@/modules/chat/utils/pin";

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

const row = (
  id: string,
  available: boolean,
  o: Partial<ChatModelOption> = {},
): ChatModelOption => ({
  id,
  label: `${id} label`,
  shortLabel: `${id} short`,
  provider: id.split(":")[0],
  supportsImages: true,
  available,
  ...o,
});

const SONNET = "anthropic:claude-sonnet-5";
const GPT = "openai:gpt-5.4";
const GEMINI = "google_genai:gemini-3.8-flash";

// --- pinState -------------------------------------------------------------
eq(pinState(null, [row(GPT, true)]), { kind: "auto" }, "no pick is Auto");
eq(
  pinState(SONNET, [row(SONNET, true)]),
  {
    kind: "pinned",
    id: SONNET,
    label: `${SONNET} label`,
    shortLabel: `${SONNET} short`,
    status: "available",
  },
  "a pin the list offers is available",
);
eq(
  pinState(SONNET, [row(SONNET, false)]),
  {
    kind: "pinned",
    id: SONNET,
    label: `${SONNET} label`,
    shortLabel: `${SONNET} short`,
    status: "unavailable",
  },
  "a pin the list marks unavailable keeps its label, marked unavailable",
);
eq(
  pinState(SONNET, [row(GPT, true)], { [SONNET]: "Claude Sonnet 5" }),
  {
    kind: "pinned",
    id: SONNET,
    label: "Claude Sonnet 5",
    shortLabel: "Claude Sonnet 5",
    status: "unlisted",
  },
  "a pin the list no longer carries shows its last known label, unlisted",
);
eq(
  pinState(SONNET, [], {}).kind === "pinned" &&
    (pinState(SONNET, [], {}) as { label: string }).label,
  "claude-sonnet-5",
  "an unlisted pin with no remembered label falls back to its model name",
);
eq(fallbackLabel("plain-id"), "plain-id", "fallback keeps an unprefixed id");
eq(
  pinState(SONNET, undefined, { [SONNET]: "Claude Sonnet 5" }),
  {
    kind: "pinned",
    id: SONNET,
    label: "Claude Sonnet 5",
    shortLabel: "Claude Sonnet 5",
    status: "unconfirmed",
  },
  "before the list answers the pin is unconfirmed, still shown by name",
);
eq(
  [
    isBlocked(pinState(SONNET, [row(SONNET, false)])),
    isBlocked(pinState(SONNET, [])),
    isBlocked(pinState(SONNET, [row(SONNET, true)])),
    isBlocked(pinState(SONNET, undefined)),
    isBlocked(pinState(null, [])),
  ],
  [true, true, false, false, false],
  "only an unavailable or unlisted pin blocks a send",
);

// --- runPin: a pin is sent as itself or not at all --------------------------
eq(runPin(null, [row(GPT, true)]), { send: true, model: null }, "Auto sends");
eq(runPin(null, undefined), { send: true, model: null }, "Auto needs no list");
eq(
  runPin(SONNET, [row(SONNET, true)]),
  { send: true, model: SONNET },
  "an available pin is sent pinned",
);
eq(
  runPin(SONNET, undefined),
  { send: true, model: SONNET },
  "an unconfirmed pin is sent pinned (the server refuses, never swaps)",
);
eq(
  runPin(SONNET, [row(SONNET, false)]),
  { send: false },
  "an unavailable pin sends nothing",
);
eq(
  runPin(SONNET, [row(GPT, true)]),
  { send: false },
  "an unlisted pin sends nothing",
);

const lists: (ChatModelOption[] | undefined)[] = [
  undefined,
  [],
  [row(SONNET, true)],
  [row(SONNET, false)],
  [row(GPT, true), row(SONNET, false)],
  [row(GPT, false)],
];
let unpinned = 0;
for (const pin of [SONNET, GPT, "unknown:model"]) {
  for (const list of lists) {
    const out = runPin(pin, list);
    if (out.send && out.model !== pin) unpinned++;
  }
}
eq(
  unpinned,
  0,
  "no pin, under any list, is ever sent as another model or Auto",
);

// --- pickerGroups ---------------------------------------------------------
const list = [row(SONNET, false), row(GPT, true), row(GEMINI, false)];
eq(
  pickerGroups(list, pinState(null, list)),
  [["openai", [{ id: GPT, label: `${GPT} label`, choosable: true }]]],
  "on Auto, unavailable models are not offered",
);
eq(
  pickerGroups(list, pinState(SONNET, list)),
  [
    ["anthropic", [{ id: SONNET, label: `${SONNET} label`, choosable: false }]],
    ["openai", [{ id: GPT, label: `${GPT} label`, choosable: true }]],
  ],
  "an unavailable pin keeps its row in place, not choosable",
);
eq(
  pickerGroups(
    [row(GPT, true)],
    pinState(SONNET, [row(GPT, true)], {
      [SONNET]: "Claude Sonnet 5",
    }),
  ),
  [
    ["openai", [{ id: GPT, label: `${GPT} label`, choosable: true }]],
    [
      "No longer offered",
      [{ id: SONNET, label: "Claude Sonnet 5", choosable: false }],
    ],
  ],
  "an unlisted pin is shown last by its remembered label, not choosable",
);
eq(
  pickerGroups([row(SONNET, true)], pinState(SONNET, [row(SONNET, true)])),
  [["anthropic", [{ id: SONNET, label: `${SONNET} label`, choosable: true }]]],
  "an available pin is an ordinary row",
);

// --- the store: nothing rewrites a pin ------------------------------------
const prefs = useChatPrefsStore.getState;
eq(
  "forget" in prefs(),
  false,
  "the store has no action that drops a pin to Auto",
);
prefs().openThread("t1");
prefs().pick(SONNET, "t1");
prefs().rememberLabels([row(SONNET, false, { label: "Claude Sonnet 5" })]);
prefs().rememberLabels([row(GPT, true)]);
eq(
  [prefs().model, prefs().last, prefs().threads.t1],
  [SONNET, SONNET, SONNET],
  "the list answering leaves the pick, the last pick and the thread alone",
);
prefs().openThread("t2");
prefs().openThread("t1");
eq(prefs().model, SONNET, "reopening the thread keeps its unavailable pin");
prefs().openThread(null);
eq(
  prefs().model,
  SONNET,
  "a new chat starts on the last pick, unavailable or not",
);
prefs().openThread("t1");
const stored = JSON.parse(localStorage.getItem("chat-model-prefs") ?? "{}");
eq(
  stored.state?.labels?.[SONNET],
  "Claude Sonnet 5",
  "remembered labels are persisted, so an unlisted pin keeps its name",
);
eq(stored.state?.threads?.t1, SONNET, "the persisted thread pin is unchanged");

// --- the gate: waits, then sends on the user's choice ---------------------
let models: ChatModelOption[] | undefined = [
  row(SONNET, false, { label: "Claude Sonnet 5" }),
  row(GPT, true),
];
let refreshes = 0;
const gate = createModelGate({
  getModel: () => prefs().model,
  getModels: () => models,
  hold: (send) => useModelChoiceStore.getState().hold(send),
  refresh: () => void refreshes++,
});
const choice = useModelChoiceStore.getState;

const sent: (string | null)[] = [];
let cancelled = 0;
const send = (model: string | null) => void sent.push(model);
const onCancel = () => void cancelled++;

eq(gate(send, onCancel), false, "a send on an unavailable pin does not go out");
eq(sent, [], "nothing was submitted");
eq(choice().held !== null, true, "the send is held for the user's choice");
eq(refreshes, 1, "the list is re-read when a send is held");
eq(prefs().model, SONNET, "the pin is not touched");

choice().cancel();
eq([sent, cancelled], [[], 1], "closing the choice sends nothing and says so");
eq(choice().held, null, "nothing is held after a cancel");
eq(prefs().model, SONNET, "a cancelled choice leaves the pin as it was");

gate(send, onCancel);
prefs().pick(null, "t1");
choice().chosen();
eq(sent, [null], "choosing Auto sends the held message on Auto");
eq(prefs().threads.t1, null, "Auto was the user's own pick, recorded as such");

sent.length = 0;
prefs().pick(SONNET, "t1");
gate(send, onCancel);
prefs().pick(GPT, "t1");
choice().chosen();
eq(sent, [GPT], "choosing another model sends the held message on it");

sent.length = 0;
cancelled = 0;
prefs().pick(SONNET, "t1");
gate(send, onCancel);
gate(send, onCancel);
eq(
  cancelled,
  1,
  "a newer blocked send replaces the older one, which is cancelled",
);
choice().cancel();
eq([sent, cancelled], [[], 2], "and neither went out");

sent.length = 0;
models = [row(GPT, true)];
eq(gate(send), false, "a pin the list no longer carries is held the same way");
choice().cancel();
eq(sent, [], "and nothing went out for it");

sent.length = 0;
models = [row(SONNET, true, { label: "Claude Sonnet 5" }), row(GPT, true)];
eq(gate(send), true, "once the model is back the pin sends at once");
eq(sent, [SONNET], "on the same pin, with no action from the user");

sent.length = 0;
models = [row(SONNET, false)];
gate(send);
models = [row(SONNET, true)];
choice().chosen();
eq(
  sent,
  [SONNET],
  "a held send re-reads the pin: re-choosing it once back sends it",
);

sent.length = 0;
models = undefined;
eq(gate(send), true, "while the list has not answered, the pin still sends");
eq(sent, [SONNET], "pinned, never as Auto");

if (failures > 0) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("\nall passed");
