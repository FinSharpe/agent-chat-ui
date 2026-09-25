/**
 * Credits on the web (finsharpe-agents#280): the rules the Credits page, the
 * account rows and the Pipeline quote share with finsharpe-mobile, checked
 * without a browser.
 *
 * - figures: a Balance to two decimals with a true minus, a price whole, a
 *   History amount signed (#223 §2, #229);
 * - the state line under the Balance, chosen by `gated` and the sign;
 * - the Credit Request's mailto (#223 §5);
 * - a History entry as a row, in every state #279 lists (open, stopped,
 *   timed out, errored, waived, refunded, a thread that is gone), flat;
 * - the page's sections: a read that failed is never drawn as a zero Balance
 *   or an empty History;
 * - the `credits` carrier the Balance refetch keys on;
 * - the purchase's structured refusals (402 / 409 / 503, #251) and the quote
 *   each re-draws;
 * - that nothing in the copy or the contract names a currency, a rate or a
 *   token count (B6).
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type {
  UserCreditHistoryEntry,
  UserCreditHistoryPage,
} from "@/api/generated/credits-apis/models";
import type { QuoteResponse } from "@/api/generated/pipelines-apis/models";
import * as copy from "@/modules/credits/constants/copy";
import {
  creditsCarrierSignatures,
  getCreditsCarrier,
  noteNewCarriers,
} from "@/modules/credits/utils/carrier";
import {
  balanceLabel,
  formatCredits,
  formatPriceCredits,
  formatSignedCredits,
  priceLabel,
} from "@/modules/credits/utils/format";
import {
  creditStateOf,
  dayLabel,
  historyEntries,
  historyRowView,
} from "@/modules/credits/utils/history";
import {
  creditRequestBody,
  creditRequestHref,
} from "@/modules/credits/utils/request";
import {
  balanceSection,
  historySection,
  olderControl,
} from "@/modules/credits/utils/sections";
import { PipelineApiError } from "@/modules/pipelines/api/pipelines-client";
import * as refusalCopy from "@/modules/pipelines/utils/purchase-refusal";
import {
  purchaseRefusalOf,
  quoteAfterRefusal,
} from "@/modules/pipelines/utils/purchase-refusal";

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

/* -------------------------------------------------------------------------- */
/* Figures                                                                     */
/* -------------------------------------------------------------------------- */

eq(formatCredits(1240), "12.40", "a Balance prints two decimals");
eq(
  formatCredits(-1310),
  "−13.10",
  "a negative Balance keeps its true figure, with U+2212",
);
eq(formatCredits(0), "0.00", "zero is 0.00");
eq(formatCredits(5), "0.05", "a few hundredths are padded");
eq(formatCredits(-5), "−0.05", "a few hundredths below zero keep the sign");
eq(formatSignedCredits(2000), "+20.00", "an Allotment is signed +");
eq(formatSignedCredits(-42), "−0.42", "a Charge is signed −");
eq(formatSignedCredits(0), "0.00", "nothing moved carries no sign");
eq(formatPriceCredits(1000), "10", "a price prints whole");
eq(
  formatPriceCredits(1050),
  "10.50",
  "a price is never rounded into another number",
);
eq(priceLabel(1000), "10 credits", "the price label");
eq(priceLabel(100), "1 credit", "one credit is singular");
eq(balanceLabel(340), "3.40 credits", "the Balance label");
eq(balanceLabel(-1310), "−13.10 credits", "a negative Balance label");

/* -------------------------------------------------------------------------- */
/* The state line                                                              */
/* -------------------------------------------------------------------------- */

eq(
  creditStateOf({ balance_minor: 1240, gated: false }),
  "none",
  "at or above zero: nothing",
);
eq(creditStateOf({ balance_minor: 0, gated: false }), "none", "zero: nothing");
eq(
  creditStateOf({ balance_minor: -1310, gated: false }),
  "below_zero",
  "below zero, not refused: the below-zero line",
);
eq(
  creditStateOf({ balance_minor: -1310, gated: true }),
  "short_balance",
  "gated: the Short Balance notice",
);
eq(
  creditStateOf({ balance_minor: 200, gated: true }),
  "short_balance",
  "gated is the server's verdict, whatever the sign",
);
eq(
  copy.BELOW_ZERO_LINE,
  "Your balance is below zero.",
  "the below-zero sentence",
);
eq(
  copy.SHORT_BALANCE_NOTICE,
  "Your credits are used up. Chat is paused until more are added.",
  "the Short Balance sentence",
);

/* -------------------------------------------------------------------------- */
/* The Credit Request                                                          */
/* -------------------------------------------------------------------------- */

const REQUEST_BODY = [
  "Hi FinSharpe,",
  "",
  "Please add credits to my account.",
  "",
  "Account: ada@example.com",
  "Balance: −13.10 credits",
  "App: Web",
].join("\n");
eq(
  creditRequestBody({ email: "ada@example.com", balanceMinor: -1310 }),
  REQUEST_BODY,
  "the request body names the account, the Balance and the app",
);
const href = creditRequestHref({
  email: "ada@example.com",
  balanceMinor: -1310,
});
const PREFIX =
  "mailto:info@finsharpe.com?subject=FinSharpe%20credits%20request&body=";
eq(
  href.startsWith(PREFIX),
  true,
  "the request goes to support, with the subject",
);
eq(
  decodeURIComponent(href.slice(PREFIX.length)),
  REQUEST_BODY,
  "the body survives the mailto",
);
eq(
  creditRequestBody({ email: null, balanceMinor: null }),
  "Hi FinSharpe,\n\nPlease add credits to my account.\n\nApp: Web",
  "a line not known yet is left out, never guessed",
);
eq(
  creditRequestBody({ email: "ada@example.com", balanceMinor: 0 }),
  "Hi FinSharpe,\n\nPlease add credits to my account.\n\nAccount: ada@example.com\nBalance: 0.00 credits\nApp: Web",
  "a zero Balance is a Balance, and stated",
);

/* -------------------------------------------------------------------------- */
/* History rows                                                                */
/* -------------------------------------------------------------------------- */

// 14:30 IST on 25 September 2026.
const NOW = new Date("2026-09-25T09:00:00Z");
const TITLES = new Map([["t1", "Reliance results"]]);

function entry(
  partial: Partial<UserCreditHistoryEntry>,
): UserCreditHistoryEntry {
  return {
    kind: "turn",
    occurred_at: "2026-09-25T08:32:00Z",
    amount_minor: -42,
    status: "closed",
    title: null,
    turn_id: null,
    thread_id: null,
    closes_at: null,
    terminal_status: null,
    purchase_id: null,
    run_id: null,
    ...partial,
  };
}
const row = (e: UserCreditHistoryEntry, index = 0) =>
  historyRowView(e, { threadTitles: TITLES, now: NOW, index });

const openStopped = row(
  entry({
    turn_id: "run-1",
    thread_id: "t1",
    status: "open",
    closes_at: "2026-09-26T08:32:00Z",
    terminal_status: "interrupted",
  }),
);
eq(
  [openStopped.title, openStopped.sub, openStopped.amount, openStopped.tone],
  [
    "Reliance results",
    "Today · 14:02 · stopped · may adjust until tomorrow 14:02",
    "−0.42",
    "ink",
  ],
  "an open, stopped turn: its thread's title, the qualifiers, a Charge in ink",
);
eq(
  openStopped.target,
  { kind: "thread", threadId: "t1" },
  "a turn opens its thread",
);

const openToday = row(
  entry({ thread_id: "t1", status: "open", closes_at: "2026-09-25T12:00:00Z" }),
);
eq(
  openToday.sub,
  "Today · 14:02 · may adjust until 17:30",
  "an open turn closing today names the time only",
);

const gone = row(
  entry({ thread_id: "deleted", occurred_at: "2026-09-25T05:35:00Z" }),
);
eq(
  [gone.title, gone.sub, gone.target],
  ["Chat", "Today · 11:05", null],
  "a thread that is gone reads Chat and opens nothing",
);

const noThread = row(entry({ thread_id: null }));
eq(
  [noThread.title, noThread.target],
  ["Chat", null],
  "a turn with no thread reads Chat",
);

const waived = row(
  entry({ status: "waived", terminal_status: "timeout", amount_minor: 0 }),
);
eq(
  [waived.sub, waived.amount],
  ["Today · 14:02 · timed out · waived", "0.00"],
  "a timed-out turn, waived",
);

const refundedTurn = row(
  entry({ status: "refunded", terminal_status: "error", amount_minor: -15 }),
);
eq(
  refundedTurn.sub,
  "Today · 14:02 · ended with an error · refunded",
  "an errored turn, refunded",
);

const purchase = row(
  entry({
    kind: "purchase",
    occurred_at: "2026-09-24T05:50:00Z",
    amount_minor: -1000,
    title: "Stock Deep Dive · TCS",
    purchase_id: "p1",
    run_id: "r1",
  }),
);
eq(
  [
    purchase.title,
    purchase.sub,
    purchase.amount,
    purchase.tone,
    purchase.target,
  ],
  [
    "Stock Deep Dive · TCS",
    "Yesterday · 11:20 · Report",
    "−10.00",
    "ink",
    { kind: "report", runId: "r1" },
  ],
  "a purchase: the server's title, Report, opens its report",
);

const refundedPurchase = row(
  entry({
    kind: "purchase",
    status: "refunded",
    title: "Stock Deep Dive · TCS",
    run_id: "r2",
  }),
);
eq(
  [refundedPurchase.sub, refundedPurchase.target],
  ["Today · 14:02 · Report · refunded", null],
  "a refunded purchase is named so, and does not open a report it no longer owns",
);

const allotment = row(
  entry({
    kind: "allotment",
    occurred_at: "2025-09-19T04:30:00Z",
    amount_minor: 2000,
    title: "Starting credits",
  }),
);
eq(
  [
    allotment.title,
    allotment.sub,
    allotment.amount,
    allotment.tone,
    allotment.target,
  ],
  ["Starting credits", "19 September 2025 · 10:00", "+20.00", "positive", null],
  "an Allotment in positive green, dated with its year",
);

const refund = row(
  entry({
    kind: "refund",
    occurred_at: "2026-09-19T04:30:00Z",
    amount_minor: 1000,
    title: "Refund · Stock Deep Dive",
  }),
);
eq(
  [refund.sub, refund.amount, refund.tone],
  ["19 September · 10:00", "+10.00", "positive"],
  "a Refund in positive green, this year's date without the year",
);

const untitled = row(
  entry({ kind: "allotment", amount_minor: 500, title: "  " }),
);
eq(untitled.title, "Credits added", "an Allotment the server left untitled");

eq(
  [row(entry({}), 0).key === row(entry({}), 1).key],
  [false],
  "two same-instant rows keep distinct keys",
);
eq(
  dayLabel(new Date("2026-09-26T18:45:00Z"), NOW),
  "27 September",
  "an IST date past midnight UTC is the next day",
);

const page = (
  entries: UserCreditHistoryEntry[],
  next: string | null,
): UserCreditHistoryPage => ({
  entries,
  next_cursor: next,
});
eq(
  historyEntries([
    page([entry({ amount_minor: -1 }), entry({ amount_minor: -2 })], "c1"),
    page([entry({ amount_minor: -3 })], null),
  ]).map((e) => e.amount_minor),
  [-1, -2, -3],
  "pages flatten in the order the server sent them: newest first",
);
eq(historyEntries(undefined), [], "no pages yet is no rows");

/* -------------------------------------------------------------------------- */
/* The page's sections: failure is never drawn as empty                        */
/* -------------------------------------------------------------------------- */

eq(
  balanceSection({ data: undefined, isError: false }),
  "loading",
  "a Balance on its way: the skeleton",
);
eq(
  balanceSection({ data: undefined, isError: true }),
  "error",
  "a Balance that failed: the error, never 0.00",
);
eq(
  balanceSection({ data: { balance_minor: 0, gated: false }, isError: false }),
  "ready",
  "a Balance of zero is a Balance",
);
eq(
  balanceSection({
    data: { balance_minor: 1240, gated: false },
    isError: true,
  }),
  "ready",
  "a failed refetch keeps the figure the server last gave",
);
eq(
  historySection({ data: undefined, isError: false }, 0),
  "loading",
  "a History on its way: the skeleton",
);
eq(
  historySection({ data: undefined, isError: true }, 0),
  "error",
  "a History that failed: the error, never the empty copy",
);
eq(
  historySection({ data: { pages: [page([], null)] }, isError: false }, 0),
  "empty",
  "a History that loaded empty: the empty copy",
);
eq(
  historySection({ data: { pages: [] }, isError: false }, 3),
  "list",
  "a History with rows: the list",
);
eq(
  olderControl({ hasNextPage: true, isFetchNextPageError: false }),
  "more",
  "older pages: Show older",
);
eq(
  olderControl({ hasNextPage: true, isFetchNextPageError: true }),
  "error",
  "a failed older page says so, with its retry",
);
eq(
  olderControl({ hasNextPage: false, isFetchNextPageError: false }),
  "none",
  "the last page: nothing under the list",
);

/* -------------------------------------------------------------------------- */
/* The credits carrier                                                         */
/* -------------------------------------------------------------------------- */

const charged = {
  id: "ai-1",
  type: "ai",
  additional_kwargs: {
    credits: {
      kind: "charge",
      turn_id: "run-1",
      status: "open",
      charge_minor: 42,
    },
  },
};
const refused = {
  id: "ai-2",
  type: "ai",
  additional_kwargs: { credits: { kind: "refused" } },
};
eq(
  getCreditsCarrier(charged),
  charged.additional_kwargs.credits,
  "a Charge carrier is read",
);
eq(
  getCreditsCarrier(refused),
  { kind: "refused" },
  "a refusal carrier is read",
);
eq(getCreditsCarrier({ additional_kwargs: {} }), null, "no carrier");
eq(
  getCreditsCarrier({ additional_kwargs: { credits: "x" } }),
  null,
  "a non-object is not a carrier",
);
eq(getCreditsCarrier(null), null, "no message");

const reordered = {
  id: "ai-1",
  additional_kwargs: {
    credits: {
      charge_minor: 42,
      status: "open",
      turn_id: "run-1",
      kind: "charge",
    },
  },
};
eq(
  creditsCarrierSignatures([charged]),
  creditsCarrierSignatures([reordered]),
  "key order never makes one carrier look like two",
);
const seen = new Set(creditsCarrierSignatures([charged]));
eq(
  noteNewCarriers(seen, creditsCarrierSignatures([charged])),
  false,
  "the same answer re-sent is not a landing",
);
eq(
  noteNewCarriers(seen, creditsCarrierSignatures([charged, refused])),
  true,
  "a new answer's carrier is a landing",
);
const closed = {
  ...charged,
  additional_kwargs: {
    credits: {
      ...charged.additional_kwargs.credits,
      status: "closed",
      charge_minor: 44,
    },
  },
};
eq(
  noteNewCarriers(seen, creditsCarrierSignatures([closed, refused])),
  true,
  "the same answer with a moved Charge is a landing",
);

/* -------------------------------------------------------------------------- */
/* Purchase refusals (#251)                                                    */
/* -------------------------------------------------------------------------- */

const QUOTE: QuoteResponse = {
  price_minor: 1000,
  balance_minor: 1240,
  charged_minor: 1000,
  can_afford: true,
  shortfall_minor: 0,
  pipeline_id: "stock-deep-dive",
  pipeline_version: 1,
  target: { symbol: "TCS" } as QuoteResponse["target"],
  target_key: "TCS",
  vintage_map: {},
  coverage_gaps: [],
  price_credits: 10,
  balance_credits: 12,
  instant_reuse: false,
};

const short = new PipelineApiError(
  402,
  "Insufficient credits: Stock Deep Dive costs 10 credits",
  {
    detail: "Insufficient credits: Stock Deep Dive costs 10 credits",
    error: "insufficient_credits",
    price_minor: 1000,
    balance_minor: 340,
    can_afford: false,
    shortfall_minor: 660,
  },
);
const shortRefusal = purchaseRefusalOf(short);
eq(
  shortRefusal,
  {
    kind: "short_balance",
    figures: {
      price_minor: 1000,
      balance_minor: 340,
      can_afford: false,
      shortfall_minor: 660,
    },
  },
  "a 402 is a short Balance, with the figures the server read",
);
const redrawn = quoteAfterRefusal(QUOTE, shortRefusal!);
eq(
  [
    redrawn?.balance_minor,
    redrawn?.can_afford,
    redrawn?.shortfall_minor,
    redrawn?.target_key,
  ],
  [340, false, 660, "TCS"],
  "the quote is re-drawn short, keeping what it said about the report",
);
eq(
  purchaseRefusalOf(
    new PipelineApiError(402, "Insufficient credits", {
      detail: "Insufficient credits",
    }),
  ),
  { kind: "short_balance", figures: null },
  "a 402 without figures is still a short Balance",
);
eq(
  quoteAfterRefusal(QUOTE, { kind: "short_balance", figures: null }),
  undefined,
  "with nothing to draw from, the quote is asked again",
);
const raced = purchaseRefusalOf(
  new PipelineApiError(402, "x", {
    detail: "x",
    price_minor: 1000,
    balance_minor: 1500,
    can_afford: true,
    shortfall_minor: 0,
  }),
);
eq(
  quoteAfterRefusal(QUOTE, raced!)?.can_afford,
  true,
  "affordability is the server's verdict, even when credits landed in between",
);

const fresh: QuoteResponse = {
  ...QUOTE,
  price_minor: 1200,
  charged_minor: 1200,
  shortfall_minor: 0,
};
const moved = new PipelineApiError(
  409,
  "The price of Stock Deep Dive has changed to 12 credits",
  {
    detail: "The price of Stock Deep Dive has changed to 12 credits",
    error: "price_changed",
    quote: fresh,
  },
);
eq(
  purchaseRefusalOf(moved),
  { kind: "price_changed", quote: fresh },
  "a 409 price_changed carries the fresh quote",
);
eq(
  quoteAfterRefusal(QUOTE, purchaseRefusalOf(moved)!),
  fresh,
  "the fresh quote replaces the one on screen",
);
eq(
  purchaseRefusalOf(
    new PipelineApiError(409, "Report not published yet", {
      detail: "Report not published yet",
    }),
  ),
  null,
  "a 409 without the code is not a price change",
);
eq(
  purchaseRefusalOf(
    new PipelineApiError(
      503,
      "Reports are briefly unavailable — try again in a minute.",
      {
        detail: "Reports are briefly unavailable — try again in a minute.",
        error: "purchases_unavailable",
      },
    ),
  ),
  { kind: "unavailable" },
  "a 503 purchases_unavailable is briefly unavailable",
);
eq(
  purchaseRefusalOf(
    new PipelineApiError(503, "Pipeline 'x' is not available", {
      detail: "Pipeline 'x' is not available",
    }),
  ),
  null,
  "a 503 without the code (a runtime that never loaded) is not that",
);
eq(
  purchaseRefusalOf(new Error("network")),
  null,
  "a network failure is no refusal",
);
eq(
  purchaseRefusalOf(new PipelineApiError(404, "Unknown symbol")),
  null,
  "a 404 is no refusal",
);
eq(
  refusalCopy.PURCHASES_UNAVAILABLE_NOTICE,
  "Reports are briefly unavailable — try again in a minute.",
  "the unavailable line is our own constant",
);
eq(
  copy.quoteShortfallSentence(formatCredits(660)),
  "You need 6.60 credits more to commission this report. You can request more from the Credits screen.",
  "the quote's short-balance sentence (#229)",
);

/* -------------------------------------------------------------------------- */
/* No currency, rate or token count (B6)                                       */
/* -------------------------------------------------------------------------- */

const MONEY =
  /\$|₹|\b(usd|inr|dollars?|rupees?|rates?|tokens?|costs?|pricing)\b/i;

const sentences = [
  ...Object.values(copy as Record<string, unknown>).filter(
    (v): v is string => typeof v === "string",
  ),
  ...Object.values(copy.KIND_FALLBACK_TITLE),
  ...Object.values(copy.TERMINAL_STATUS_WORDS),
  copy.mayAdjustUntil("14:02"),
  copy.quoteShortfallSentence("6.60"),
  copy.chargeLabelName("0.42 credits"),
  refusalCopy.PRICE_CHANGED_NOTICE,
  refusalCopy.PURCHASES_UNAVAILABLE_NOTICE,
  REQUEST_BODY,
];
eq(
  sentences.filter((s) => MONEY.test(s)),
  [],
  "no Credits sentence names a currency, a rate or a token count",
);

// The contract itself: every field the Credits API and the quote's money
// models carry. A field that named USD or tokens would be one a screen could
// render by accident.
const FIELD = /^\s+(\w+)\??:/gm;
function fieldsIn(dir: string, only?: RegExp): string[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".ts") && (!only || only.test(file)))
    .flatMap((file) =>
      [...readFileSync(join(dir, file), "utf8").matchAll(FIELD)].map(
        (m) => `${file}:${m[1]}`,
      ),
    );
}
const creditFields = fieldsIn(
  join(process.cwd(), "src/api/generated/credits-apis/models"),
);
const quoteFields = fieldsIn(
  join(process.cwd(), "src/api/generated/pipelines-apis/models"),
  /^(quoteResponse|catalogEntry|purchaseResponse|insufficientCreditsError|priceChangedError|purchasesUnavailableError)\.ts$/,
);
eq(
  creditFields.length > 0 && quoteFields.length > 0,
  true,
  "the contract's models were read",
);
eq(
  [...creditFields, ...quoteFields].filter((f) =>
    /usd|cost|token|rate/i.test(f.split(":")[1]),
  ),
  [],
  "no field on the Credits or quote contract is a USD figure, a rate or a token count",
);

if (failures > 0) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
