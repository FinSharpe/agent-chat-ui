/**
 * Credits in chat (finsharpe-agents#282), drawn by the real transcript
 * (`MessageList` → `AssistantMessage`) over the messages the agents send:
 *
 * - a turn whose answer carries `additional_kwargs.credits = {kind: "charge",
 *   turn_id, status, charge_minor}` shows `0.42 credits` under its card —
 *   outside the bubble, not in the hover-only CommandBar — opening the
 *   Credits page, named "This answer used 0.42 credits" for a screen reader;
 *   an answer without the carrier, or with a negative figure, shows none;
 * - a turn refused on a Short Balance — `{kind: "refused"}` beside the Refusal
 *   Marker, and keyed on the carrier alone — is an ordinary answer card with
 *   the Short Balance notice and the Request credits pill beside it, and no
 *   label, only while it is the thread's latest turn; once a later turn
 *   exists it is the answer card alone (owner, 2026-09-25);
 * - the composer stays live after a refusal;
 * - nothing drawn names a USD figure, a rate or a token count, whatever else a
 *   carrier might carry.
 *
 * Who gets a carrier is the agents' (at 04dd6bc: `middleware/credit_label.py`
 * `sees_charge`, `middleware/input_guardrail.py` `short_balance_refusal`):
 * the fixtures below are the messages their tests pin, and the client has no
 * switch of its own.
 */

import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";

import ChatComposer from "@/modules/chat/components/ChatComposer";
import { readCreditsCarrier } from "@/modules/credits/utils/carrier";

import {
  ai,
  ancestorsOf,
  findAll,
  human,
  parseMarkup,
  renderThread,
  textOf,
  type MarkupElement,
} from "../harness/chat-thread";

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

const rendered: string[] = [];
function thread(fixture: Parameters<typeof renderThread>[0]): string {
  const markup = renderThread(fixture);
  rendered.push(markup);
  return markup;
}

/* -------------------------------------------------------------------------- */
/* The wire, as the agents' tests pin it (04dd6bc)                             */
/* -------------------------------------------------------------------------- */

/** `credit_label.charge_label`: the frozen four keys (test_credit_label.py). */
const charge = (charge_minor: number, status = "open") => ({
  credits: { kind: "charge", turn_id: "run-admin", status, charge_minor },
});

/** `gate.SHORT_BALANCE_MESSAGE`, stored in the thread and shown verbatim. */
const SHORT_BALANCE_MESSAGE =
  "Your FinSharpe credits are used up, so I can't take this question right now. You can request more from the Credits screen, and I'll pick up where we left off.";

/** The refused turn's final message: exactly both carriers
 *  (test_short_balance_refusal.py, test_short_balance.py). */
const REFUSED_KWARGS = {
  credits: { kind: "refused" },
  finsharpe_refusal: { kind: "short_balance" },
};

const ANSWER = "INFY trades at a P/E of 24.5 on the NSE.";
const NOTICE = "Your credits are used up. Chat is paused until more are added.";

const question = (id: string) => human(id, "What is INFY's P/E ratio?");

/* -------------------------------------------------------------------------- */
/* Reading the carrier                                                         */
/* -------------------------------------------------------------------------- */

const withKwargs = (additional_kwargs: unknown) => ({ additional_kwargs });
eq(
  [
    readCreditsCarrier(withKwargs(charge(42))),
    readCreditsCarrier(withKwargs(charge(0, "closed"))),
    readCreditsCarrier(withKwargs(REFUSED_KWARGS)),
  ],
  [
    { kind: "charge", chargeMinor: 42 },
    { kind: "charge", chargeMinor: 0 },
    { kind: "refused" },
  ],
  "the two frozen shapes are read, and only charge_minor off a charge",
);
eq(
  [
    readCreditsCarrier(withKwargs({})),
    readCreditsCarrier(
      withKwargs({ finsharpe_refusal: { kind: "guardrail" } }),
    ),
    readCreditsCarrier(
      withKwargs({ finsharpe_refusal: { kind: "in_flight_cap" } }),
    ),
    readCreditsCarrier(withKwargs({ credits: { kind: "charge" } })),
    readCreditsCarrier(
      withKwargs({ credits: { kind: "charge", charge_minor: "42" } }),
    ),
    readCreditsCarrier(
      withKwargs({ credits: { kind: "charge", charge_minor: 4.2 } }),
    ),
    readCreditsCarrier(withKwargs({ credits: { kind: "later-kind" } })),
    readCreditsCarrier(withKwargs({ credits: "refused" })),
    readCreditsCarrier(undefined),
  ],
  [null, null, null, null, null, null, null, null, null],
  "no carrier, another refusal, a charge with no whole figure or an unknown kind draws nothing",
);
eq(
  [
    readCreditsCarrier(
      withKwargs({ finsharpe_refusal: { kind: "short_balance" } }),
    ),
    readCreditsCarrier(withKwargs({ credits: { kind: "refused" } })),
  ],
  [null, { kind: "refused" }],
  "a refusal is read off the credits carrier alone: the marker by itself is nothing, the carrier by itself is a refusal",
);
eq(
  [-1, -7, -4200].map((minor) => readCreditsCarrier(withKwargs(charge(minor)))),
  [null, null, null],
  "a negative charge_minor is no Charge: nothing is read",
);

/* -------------------------------------------------------------------------- */
/* The charge label, under the answer card                                     */
/* -------------------------------------------------------------------------- */

const cls = (node: MarkupElement | undefined) =>
  /class="([^"]*)"/.exec(node?.attrs ?? "")?.[1] ?? "";
const LABEL = /data-testid="charge-label"/;
const CARD = /class="chat-msg glass-card /;

/** Where each label sits: its text, its accessible name (an `aria-label`
 *  where there is one, else its text), its resting tone in each theme, where
 *  it leads, what holds it, and what comes before it in the turn's stack. */
function labels(markup: string) {
  return findAll(parseMarkup(markup), LABEL).map((label) => {
    const chain = ancestorsOf(label);
    const wrapper = chain[0];
    const stack = chain[1];
    const siblings = stack?.children ?? [];
    const before = siblings[siblings.indexOf(wrapper) - 1];
    const text = textOf(
      markup.slice(label.start, markup.indexOf("</a>", label.start)),
    );
    const ariaLabel = /aria-label="([^"]*)"/.exec(label.attrs)?.[1];
    return {
      text,
      name: ariaLabel === undefined ? text : textOf(ariaLabel),
      tone: cls(label)
        .split(/\s+/)
        .filter((c) => /^(dark:)?text-slate-\d+$/.test(c))
        .sort(),
      href: /href="([^"]*)"/.exec(label.attrs)?.[1],
      tag: label.tag,
      inCard: chain.some((node) => CARD.test(node.attrs)),
      inCommandBar: chain.some((node) => /chat-msg-actions/.test(node.attrs)),
      stack: cls(stack),
      right: /justify-end/.test(cls(wrapper)),
      width: /max-w-\[92%\]/.test(cls(wrapper)),
      afterCard: CARD.test(before?.attrs ?? ""),
    };
  });
}

const adminShadow = thread({
  messages: [question("h-1"), ai("a-1", ANSWER, charge(42))],
});
eq(
  labels(adminShadow),
  [
    {
      text: "0.42 credits",
      name: "This answer used 0.42 credits",
      // design-system.css: slate-500 is navy 84% on white (~9.8:1); in dark
      // mode both slate tones resolve to --text-muted (~7.7:1). AA is 4.5:1.
      tone: ["dark:text-slate-400", "text-slate-500"],
      href: "/settings/credits",
      tag: "a",
      inCard: false,
      inCommandBar: false,
      stack: "animate-fade-in flex w-full flex-col gap-3 empty:hidden",
      right: true,
      width: true,
      afterCard: true,
    },
  ],
  "a turn with a charge carrier shows `0.42 credits` right under its card, outside the bubble and the CommandBar, opening Credits",
);

const basicShadow = thread({
  messages: [question("h-1"), ai("a-1", ANSWER)],
});
eq(
  [labels(basicShadow), textOf(basicShadow).includes("credits")],
  [[], false],
  "an answer without the carrier (a user in Shadow Mode) shows no label and no credits word",
);
eq(
  textOf(adminShadow).replace(" 0.42 credits", ""),
  textOf(basicShadow),
  "the label is the only thing the carrier adds to the turn",
);

// Enforced, every account's successful turn carries it: the same shape.
const enforcedBasic = thread({
  messages: [question("h-1"), ai("a-1", ANSWER, charge(87))],
});
eq(
  labels(enforcedBasic).map((l) => l.text),
  ["0.87 credits"],
  "an enforced turn is labelled for any account, from the carrier alone",
);
eq(
  labels(enforcedBasic).map((l) => [
    l.name,
    l.name.endsWith(l.text),
    l.href,
    l.tag,
  ]),
  [["This answer used 0.87 credits", true, "/settings/credits", "a"]],
  "the label's accessible name says what the figure is and contains it, and it still opens Credits",
);
eq(
  [-7, -4200].map((minor) => {
    const markup = thread({
      messages: [question("h"), ai("a", ANSWER, charge(minor))],
    });
    return [labels(markup).length, textOf(markup).includes("credits")];
  }),
  [
    [0, false],
    [0, false],
  ],
  "a negative charge_minor draws no label: no figure is guessed",
);

eq(
  [0, 7, 100, 1234, 100000].map(
    (minor) =>
      labels(
        thread({ messages: [question("h"), ai("a", ANSWER, charge(minor))] }),
      )[0]?.text,
  ),
  [
    "0.00 credits",
    "0.07 credits",
    "1.00 credits",
    "12.34 credits",
    "1000.00 credits",
  ],
  "two decimals always, the word 'credits' always, 0.00 credits for a zero",
);
eq(
  ["open", "closed", "waived"].map(
    (status) =>
      labels(
        thread({
          messages: [question("h"), ai("a", ANSWER, charge(42, status))],
        }),
      )[0]?.text,
  ),
  ["0.42 credits", "0.42 credits", "0.42 credits"],
  "the label is the Charge whatever the turn's status: later moves are the History's",
);

const twoTurns = thread({
  messages: [
    question("h-1"),
    ai("a-1", ANSWER, charge(42)),
    question("h-2"),
    ai("a-2", "And TCS trades at 28.1x."),
  ],
});
eq(
  labels(twoTurns).map((l) => l.text),
  ["0.42 credits"],
  "in a thread, only the turn with the carrier is labelled",
);
eq(
  labels(
    thread({
      messages: [question("h-1"), ai("a-1", ANSWER, charge(42))],
      isLoading: true,
    }),
  ).map((l) => l.text),
  ["0.42 credits"],
  "the label shows as soon as the carrier lands, before the run closes",
);

const scopeRefusal = thread({
  messages: [
    question("h-1"),
    ai(
      "a-1",
      "I can only help with financial markets, stock analysis, mutual funds, portfolio analysis, personal finance, and financial news. Your request falls outside that scope.",
      { finsharpe_refusal: { kind: "guardrail" } },
    ),
  ],
});
const capRefusal = thread({
  messages: [
    question("h-1"),
    ai("a-1", "You already have answers in progress.", {
      finsharpe_refusal: { kind: "in_flight_cap" },
    }),
  ],
});
eq(
  [scopeRefusal, capRefusal].map((markup) => [
    labels(markup).length,
    textOf(markup).includes(NOTICE),
    textOf(markup).includes("Request credits"),
  ]),
  [
    [0, false, false],
    [0, false, false],
  ],
  "another refusal (scope, the In-flight Cap) carries neither the label nor the notice",
);

/* -------------------------------------------------------------------------- */
/* The Short Balance refusal                                                   */
/* -------------------------------------------------------------------------- */

const refused = thread({
  messages: [question("h-1"), ai("a-1", SHORT_BALANCE_MESSAGE, REFUSED_KWARGS)],
  balanceMinor: -1310,
});
const refusedTree = parseMarkup(refused);
const [card] = findAll(refusedTree, CARD);
const [notice] = findAll(refusedTree, /data-testid="short-balance-refusal"/);
const stackOf = (node: MarkupElement | undefined) => node?.parent ?? null;
eq(
  [
    textOf(refused).includes(SHORT_BALANCE_MESSAGE),
    !!card &&
      textOf(refused.slice(card.start)).startsWith(SHORT_BALANCE_MESSAGE),
    findAll(card ?? refusedTree, /class="chat-msg-actions/).length,
  ],
  [true, true, 1],
  "the refusal's sentence is an ordinary answer card, verbatim, with its action row",
);
eq(
  [
    !!notice,
    !!card && !!notice && !ancestorsOf(notice).includes(card),
    stackOf(notice) === stackOf(card),
    (stackOf(card)?.children ?? []).indexOf(notice!) ===
      (stackOf(card)?.children ?? []).indexOf(card!) + 1,
    /max-w-\[92%\]/.test(cls(notice)),
  ],
  [true, true, true, true, true],
  "the Short Balance notice sits beside it: right under the card, outside the bubble",
);
const noticeText = notice
  ? textOf(refused.slice(notice.start, refused.indexOf("</a>", notice.start)))
  : "";
eq(
  noticeText,
  `${NOTICE} Request credits`,
  "the notice says the Credits page's words, with the Request credits pill",
);
const mailto = /href="(mailto:[^"]*)"/.exec(
  refused.slice(notice?.start ?? 0),
)?.[1];
const body = decodeURIComponent(
  (mailto ?? "").replace(/&amp;/g, "&").split("&body=")[1] ?? "",
);
eq(
  [
    mailto?.startsWith(
      "mailto:info@finsharpe.com?subject=FinSharpe%20credits%20request",
    ),
    body.split("\n"),
  ],
  [
    true,
    [
      "Hi FinSharpe,",
      "",
      "Please add credits to my account.",
      "",
      "Balance: −13.10 credits",
      "App: Web",
    ],
  ],
  "Request credits opens the prefilled email with the Balance read",
);
const unread = thread({
  messages: [question("h-1"), ai("a-1", SHORT_BALANCE_MESSAGE, REFUSED_KWARGS)],
});
eq(
  decodeURIComponent(
    (/href="(mailto:[^"]*)"/.exec(unread)?.[1] ?? "")
      .replace(/&amp;/g, "&")
      .split("&body=")[1] ?? "",
  ).includes("Balance:"),
  false,
  "a Balance not yet read is left out of the email, not guessed",
);
eq(labels(refused), [], "the refusal carries no charge label");
eq(
  (refused.match(/Your credits are used up/g) ?? []).length,
  1,
  "one notice for the latest refused turn",
);

/** The Short Balance notices a thread draws, and its Request credits pills. */
const notices = (markup: string) =>
  findAll(parseMarkup(markup), /data-testid="short-balance-refusal"/);
const pills = (markup: string) => (markup.match(/href="mailto:/g) ?? []).length;
const refusalDrawn = (markup: string) => [
  notices(markup).length,
  textOf(markup).includes(NOTICE),
  pills(markup),
  labels(markup).length,
];

// Keyed on the carrier, never on the Refusal Marker: the server sends both
// today, so each alone pins which one the client reads.
eq(
  [
    refusalDrawn(
      thread({
        messages: [
          question("h-1"),
          ai("a-1", SHORT_BALANCE_MESSAGE, {
            finsharpe_refusal: { kind: "short_balance" },
          }),
        ],
        balanceMinor: -1310,
      }),
    ),
    refusalDrawn(
      thread({
        messages: [
          question("h-1"),
          ai("a-1", SHORT_BALANCE_MESSAGE, { credits: { kind: "refused" } }),
        ],
        balanceMinor: -1310,
      }),
    ),
  ],
  [
    [0, false, 0, 0],
    [1, true, 1, 0],
  ],
  "the Refusal Marker alone draws nothing; the credits carrier alone draws the notice and the pill",
);

/* -------------------------------------------------------------------------- */
/* Only while the refusal is the thread's latest turn (owner, 2026-09-25)      */
/* -------------------------------------------------------------------------- */

// The follow-up has been sent: a later turn exists, its answer still coming.
const followUpSent = thread({
  messages: [
    question("h-1"),
    ai("a-1", SHORT_BALANCE_MESSAGE, REFUSED_KWARGS),
    question("h-2"),
  ],
  isLoading: true,
  balanceMinor: 1000,
});
// …and answered, with its Charge, once credits were added.
const followUpAnswered = thread({
  messages: [
    question("h-1"),
    ai("a-1", SHORT_BALANCE_MESSAGE, REFUSED_KWARGS),
    question("h-2"),
    ai("a-2", ANSWER, charge(42)),
  ],
  balanceMinor: 958,
});
eq(
  [refused, followUpSent, followUpAnswered].map((markup) =>
    refusalDrawn(markup).slice(0, 3),
  ),
  [
    [1, true, 1],
    [0, false, 0],
    [0, false, 0],
  ],
  "the notice and the pill show while the refusal is the latest turn, and disappear once a later turn exists",
);
const olderTree = parseMarkup(followUpAnswered);
const [olderCard] = findAll(olderTree, CARD);
eq(
  [
    !!olderCard &&
      textOf(followUpAnswered.slice(olderCard.start)).startsWith(
        SHORT_BALANCE_MESSAGE,
      ),
    findAll(olderCard ?? olderTree, /class="chat-msg-actions/).length,
    findAll(
      stackOf(olderCard) ?? olderTree,
      /data-testid="(short-balance-refusal|charge-label)"/,
    ).length,
    labels(followUpAnswered).map((l) => l.text),
  ],
  [true, 1, 0, ["0.42 credits"]],
  "an older refused turn is its ordinary answer card alone; the later answer keeps its label",
);
const twoRefusals = thread({
  messages: [
    question("h-1"),
    ai("a-1", SHORT_BALANCE_MESSAGE, REFUSED_KWARGS),
    question("h-2"),
    ai("a-2", SHORT_BALANCE_MESSAGE, REFUSED_KWARGS),
  ],
  balanceMinor: -1310,
});
const twoTree = parseMarkup(twoRefusals);
const twoCards = findAll(twoTree, CARD);
const [latestNotice, ...moreNotices] = findAll(
  twoTree,
  /data-testid="short-balance-refusal"/,
);
eq(
  [
    twoCards.length,
    !!latestNotice && moreNotices.length === 0,
    !!latestNotice && stackOf(latestNotice) === stackOf(twoCards[1]),
    pills(twoRefusals),
  ],
  [2, true, true, 1],
  "two refused turns in a row: one notice and one pill, beside the latest",
);

/* -------------------------------------------------------------------------- */
/* The composer stays live                                                     */
/* -------------------------------------------------------------------------- */

// The composer as the thread draws it once the refused run has ended: no
// run in flight, a follow-up typed. It takes no credits state at all.
function composer(variant: "card" | "pill", input: string): string {
  const client = new QueryClient();
  return renderToStaticMarkup(
    <NuqsTestingAdapter>
      <QueryClientProvider client={client}>
        <ChatComposer
          variant={variant}
          isEmpty={false}
          isLoading={false}
          input={input}
          onInputChange={() => {}}
          blocks={[]}
          onRemoveBlock={() => {}}
          onFileInput={() => {}}
          onPaste={() => {}}
          onSubmit={() => {}}
          onStop={() => {}}
        />
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  );
}
for (const variant of ["card", "pill"] as const) {
  const markup = composer(variant, "And TCS?");
  const textarea = /<textarea[^>]*>/.exec(markup)?.[0] ?? "";
  const send = /<button[^>]*type="submit"[^>]*>/.exec(markup)?.[0] ?? "";
  eq(
    [
      textarea.length > 0,
      /\sdisabled/.test(textarea),
      /readonly/i.test(textarea),
      send.length > 0,
      /\sdisabled/.test(send),
      textOf(markup).includes("paused"),
    ],
    [true, false, false, true, false, false],
    `after a refusal the ${variant} composer takes a follow-up and Send is live`,
  );
}
const source = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

// Reading credits means importing the credits module or naming its state —
// not saying "refuses" in a comment. So the scan reads import paths and the
// names the code uses, with comments (and, for names, strings) blanked.
const COMMENT_OR_STRING =
  /("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g;
const IMPORT_PATH = /\b(?:from|import)\s*\(?\s*(["'])([^"']*)\1/g;
/** A name for credits state: `useCreditBalance`, `creditKeys`,
 *  `readCreditsCarrier`, `gated`, `balance_minor`, `shortBalance…`,
 *  `…Refusal…`. */
const CREDITS_NAME =
  /\b(?:\w*credit\w*|gated|\w*balance_minor|\w*short_?balance\w*|\w*refusal\w*)\b/i;
function readsCredits(text: string): boolean {
  const code = text.replace(
    COMMENT_OR_STRING,
    (_, literal?: string) => literal ?? " ",
  );
  const names = text.replace(COMMENT_OR_STRING, " ");
  return (
    [...code.matchAll(IMPORT_PATH)].some(([, , path]) =>
      /credits/i.test(path),
    ) || CREDITS_NAME.test(names)
  );
}
eq(
  [
    readsCredits(
      "// the submit path refuses while loading\n/* credits are Admission's: a Short Balance is an answer, not an error */\nconst x = 1;",
    ),
    readsCredits('const hint = "Nothing here is paused for credits";'),
    readsCredits(
      'import { useCreditBalance } from "@/modules/credits/hooks/useCredits";',
    ),
    readsCredits('import { balanceLabel } from "../../credits/utils/format";'),
    readsCredits("const { gated } = balance;"),
    readsCredits("if (refusal) return;"),
  ],
  [false, false, true, true, true, true],
  "the scan reads imports and names, not prose: a comment about refusing cannot trip it",
);
eq(
  [
    "src/modules/chat/components/ChatComposer.tsx",
    "src/modules/chat/hooks/useChatSubmit.ts",
  ].filter((path) => readsCredits(source(path))),
  [],
  "neither the composer nor the send path reads credits: every send goes to Admission",
);
const threadSource = source("src/components/thread/index.tsx");
const composerProps =
  /<ChatComposer([\s\S]*?)\/>/.exec(threadSource)?.[1] ?? "";
eq(
  [composerProps.length > 0, readsCredits(composerProps)],
  [true, false],
  "the thread hands the composer no credits state",
);

/* -------------------------------------------------------------------------- */
/* No currency, rate or token count (B6)                                       */
/* -------------------------------------------------------------------------- */

// A carrier that carried more than the frozen shape still draws only the
// figure: nothing on it besides `charge_minor` is ever read.
const noisy = thread({
  messages: [
    question("h-1"),
    ai("a-1", ANSWER, {
      credits: {
        kind: "charge",
        turn_id: "run-x",
        status: "open",
        charge_minor: 42,
        reported_usd: 0.004217,
        usd: "0.0042",
        prompt_tokens: 1200,
        total_tokens: 1280,
        rate: 100,
        balance_after_minor: 998,
      },
    }),
  ],
});
eq(
  [
    labels(noisy).map((l) => l.text),
    ["0.004217", "0.0042", "1200", "1280", "9.98"].filter((v) =>
      noisy.includes(v),
    ),
  ],
  [["0.42 credits"], []],
  "extra fields on a carrier never reach the screen",
);
const noisyRefusal = thread({
  messages: [
    question("h-1"),
    ai("a-1", SHORT_BALANCE_MESSAGE, {
      ...REFUSED_KWARGS,
      credits: { kind: "refused", usd: 1.25, tokens: 900 },
    }),
  ],
});
eq(
  ["1.25", "900"].filter((v) => textOf(noisyRefusal).includes(v)),
  [],
  "nor on a refusal",
);
const MONEY = /\$|₹|\b(usd|inr|dollars?|rupees?|rates?|tokens?|costs?)\b/i;
eq(
  rendered.map(textOf).filter((t) => MONEY.test(t)),
  [],
  "nothing drawn in a labelled or refused thread names a currency, a rate or a token count",
);

if (failures > 0) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
