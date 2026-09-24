/**
 * The composer's model pill and picker list as rendered (finsharpe-agents#255):
 * an unavailable pin keeps its label and is marked, never shown as Auto; the
 * list asks the user to choose when a send is waiting.
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { ChatModelOption } from "@/modules/chat/api/chatModels";
import {
  ModelChoiceList,
  ModelPill,
} from "@/modules/chat/components/ModelPickerParts";
import {
  pickerGroups,
  pinState,
  type PinState,
} from "@/modules/chat/utils/pin";

let failures = 0;
function check(ok: boolean, name: string, html?: string) {
  if (ok) {
    console.log(`ok   ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}${html ? `\n  ${html}` : ""}`);
  }
}

const SONNET = "anthropic:claude-sonnet-5";
const GPT = "openai:gpt-5.4";
const row = (
  id: string,
  label: string,
  available: boolean,
): ChatModelOption => ({
  id,
  label,
  shortLabel: label.replace("Claude ", ""),
  provider: id.split(":")[0],
  supportsImages: true,
  available,
});
const offline = [
  row(SONNET, "Claude Sonnet 5", false),
  row(GPT, "GPT-5.4", true),
];
const online = [
  row(SONNET, "Claude Sonnet 5", true),
  row(GPT, "GPT-5.4", true),
];

const pill = (pin: PinState) =>
  renderToStaticMarkup(
    <ModelPill
      pin={pin}
      open={false}
      compact={false}
    />,
  );
const list = (pin: PinState, models: ChatModelOption[], waiting: boolean) =>
  renderToStaticMarkup(
    <ModelChoiceList
      pin={pin}
      groups={pickerGroups(models, pin)}
      waiting={waiting}
      onChoose={() => {}}
    />,
  );
const text = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

// --- the pill -------------------------------------------------------------
let html = pill(pinState(SONNET, offline));
check(
  html.includes("Sonnet 5"),
  "an unavailable pin keeps its label on the pill",
  html,
);
check(
  !text(html).includes("Auto"),
  "an unavailable pin is not shown as Auto",
  html,
);
check(
  html.includes("data-unavailable") && html.includes("(unavailable)"),
  "the pill is marked unavailable, for sight and for screen readers",
  html,
);
check(
  html.includes("Claude Sonnet 5 isn&#x27;t available right now"),
  "the pill's title says why",
  html,
);

html = pill(
  pinState(SONNET, [row(GPT, "GPT-5.4", true)], {
    [SONNET]: "Claude Sonnet 5",
  }),
);
check(
  html.includes("Claude Sonnet 5") && html.includes("(unavailable)"),
  "an unlisted pin shows its last known label, marked unavailable",
  html,
);

html = pill(pinState(SONNET, online));
check(
  html.includes("Sonnet 5") && !html.includes("unavailable"),
  "the same pin, available again, is an ordinary pill",
  html,
);

html = pill(pinState(SONNET, undefined, { [SONNET]: "Claude Sonnet 5" }));
check(
  html.includes("Claude Sonnet 5") && !html.includes("unavailable"),
  "before the list answers the pill names the pin it will send",
  html,
);

html = pill(pinState(null, online));
check(text(html).includes("Auto"), "no pin reads Auto", html);

// --- the list -------------------------------------------------------------
html = list(pinState(SONNET, offline), offline, true);
check(
  text(html).includes(
    "Claude Sonnet 5 isn't available right now. Choose another model or Auto to send your message.",
  ) ||
    html.includes(
      "Claude Sonnet 5 isn&#x27;t available right now. Choose another model or Auto to send your message.",
    ),
  "a held send asks the user to choose another model or Auto",
  html,
);
check(html.includes('role="status"'), "the ask is announced", html);
check(
  text(html).indexOf("Auto") < text(html).indexOf("GPT-5.4"),
  "Auto is first",
  html,
);
const sonnetRow = html.slice(
  html.lastIndexOf("<button", html.indexOf("Claude Sonnet 5</span>")),
);
check(
  /^<button[^>]*disabled/.test(sonnetRow) && sonnetRow.includes("Unavailable"),
  "the pinned row stays, marked Unavailable and not choosable",
  sonnetRow.slice(0, 400),
);
check(
  html.includes("Claude Sonnet 5 unavailable"),
  "the header says the pick is unavailable",
  html,
);

html = list(pinState(SONNET, offline), offline, false);
check(
  html.includes("Choose another model or Auto before you send"),
  "browsing with an unavailable pin says so before any send",
  html,
);

html = list(pinState(SONNET, online), online, false);
check(
  !html.includes('role="status"') &&
    !html.includes("Unavailable") &&
    html.includes("Claude Sonnet 5 selected"),
  "an available pin: no notice, an ordinary selected row",
  html,
);

html = list(pinState(null, offline), offline, false);
check(
  !html.includes("Claude Sonnet 5"),
  "an unavailable model nobody pinned is not offered",
  html,
);

if (failures > 0) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("\nall passed");
