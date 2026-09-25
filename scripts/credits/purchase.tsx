/**
 * The Pipeline purchase on #251's minor-unit fields (finsharpe-agents#280),
 * through the real purchase hook, generated client and query cache, with the
 * payment boundary answered by a stubbed `fetch`:
 *
 * - the purchase repeats the quoted `price_minor`;
 * - a 402 re-draws the quote short from the Balance the refusal read, and the
 *   quote screen shows the short-balance state — not a toast;
 * - a 409 `price_changed` replaces the quote with the fresh one it carries;
 * - a 503 `purchases_unavailable` leaves the quote as it was;
 * - whatever the answer, the Balance on the account surfaces is read again.
 */

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { QuoteResponse } from "@/api/generated/pipelines-apis/models";
import { creditKeys } from "@/modules/credits/hooks/useCredits";
import { PipelineApiError } from "@/modules/pipelines/api/pipelines-client";
import { QuoteDetails } from "@/modules/pipelines/components/quote/QuoteDetails";
import {
  pipelineKeys,
  usePurchasePipeline,
} from "@/modules/pipelines/hooks/usePipelineQueries";
import { purchaseRefusalOf } from "@/modules/pipelines/utils/purchase-refusal";

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

const PIPELINE = "stock-deep-dive";
const QUOTE: QuoteResponse = {
  price_minor: 1000,
  balance_minor: 1240,
  charged_minor: 1000,
  can_afford: true,
  shortfall_minor: 0,
  pipeline_id: PIPELINE,
  pipeline_version: 1,
  target: { symbol: "TCS" } as QuoteResponse["target"],
  target_key: "TCS",
  vintage_map: { definedge_prices: "2026-09-24" },
  coverage_gaps: [],
  price_credits: 10,
  balance_credits: 12,
  instant_reuse: false,
};

// What the payment boundary answers next, and what it was sent.
let answer: { status: number; body: unknown } = { status: 200, body: {} };
const sent: unknown[] = [];
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (url !== `/api/utilities/pipelines/${PIPELINE}/purchase`) {
    throw new Error(`unexpected fetch ${url}`);
  }
  sent.push(JSON.parse(String(init?.body)));
  return new Response(JSON.stringify(answer.body), {
    status: answer.status,
    headers: { "Content-Type": "application/json" },
  });
}) as typeof fetch;

type Purchase = ReturnType<typeof usePurchasePipeline>;

/** The hook as the quote screen holds it, against `client`. */
function mountPurchase(client: QueryClient): Purchase {
  let held: Purchase | null = null;
  function Probe() {
    held = usePurchasePipeline();
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  if (!held) throw new Error("the hook did not mount");
  return held;
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } },
  });
  client.setQueryData(pipelineKeys.quote(PIPELINE, "TCS"), QUOTE);
  client.setQueryData(pipelineKeys.catalog(), []);
  client.setQueryData(creditKeys.balance("u1"), {
    balance_minor: 1240,
    gated: false,
  });
  return { client, purchase: mountPurchase(client) };
}

const VARS = {
  pipelineId: PIPELINE,
  symbol: "TCS",
  threadId: null,
  priceMinor: QUOTE.price_minor,
};

async function attempt(purchase: Purchase) {
  return purchase.purchaseOnce(VARS).then(
    (receipt) => ({ receipt, error: null as unknown }),
    (error: unknown) => ({ receipt: null, error }),
  );
}

const quoteOf = (client: QueryClient) =>
  client.getQueryData<QuoteResponse>(pipelineKeys.quote(PIPELINE, "TCS"));
const balanceStale = (client: QueryClient) =>
  client.getQueryState(creditKeys.balance("u1"))?.isInvalidated;
/** What the quote's live region says, or null when there is none. */
const announced = (markup: string) =>
  markup.match(/data-testid="quote-announcer"[^>]*>([^<]*)</)?.[1] ?? null;

async function main() {
  // A 402: the Balance moved between the quote and the click.
  {
    const { client, purchase } = setup();
    const before = renderToStaticMarkup(
      <QuoteDetails
        quote={quoteOf(client)!}
        subject="stock"
      />,
    );
    answer = {
      status: 402,
      body: {
        detail: "Insufficient credits: Stock Deep Dive costs 10 credits",
        error: "insufficient_credits",
        price_minor: 1000,
        balance_minor: 340,
        can_afford: false,
        shortfall_minor: 660,
      },
    };
    sent.length = 0;
    const { error } = await attempt(purchase);
    eq(
      sent,
      [{ symbol: "TCS", thread_id: null, price_minor: 1000 }],
      "the purchase repeats the quoted price_minor",
    );
    eq(
      purchaseRefusalOf(error)?.kind,
      "short_balance",
      "a 402 is a short-Balance refusal, which the screen draws (no toast)",
    );
    const quote = quoteOf(client);
    eq(
      [
        quote?.balance_minor,
        quote?.can_afford,
        quote?.shortfall_minor,
        quote?.vintage_map,
      ],
      [340, false, 660, QUOTE.vintage_map],
      "the quote is re-drawn short from the refusal, keeping the rest",
    );
    const screen = renderToStaticMarkup(
      <QuoteDetails
        quote={quote!}
        subject="stock"
        refusal="short_balance"
      />,
    );
    eq(
      screen.includes(
        "You need 6.60 credits more to commission this report. You can request more from the Credits screen.",
      ),
      true,
      "the screen now shows the short-balance state",
    );
    eq(
      [announced(before), announced(screen)],
      [
        "",
        "You need 6.60 credits more to commission this report. You can request more from the Credits screen.",
      ],
      "and says it aloud: the live region was on the screen, empty, before the click",
    );
    eq(
      balanceStale(client),
      true,
      "the account surfaces' Balance is read again",
    );
  }

  // A 409: the price moved.
  {
    const { client, purchase } = setup();
    const fresh = {
      ...QUOTE,
      price_minor: 1200,
      charged_minor: 1200,
      price_credits: 12,
    };
    answer = {
      status: 409,
      body: {
        detail: "The price of Stock Deep Dive has changed to 12 credits",
        error: "price_changed",
        quote: fresh,
      },
    };
    const { error } = await attempt(purchase);
    eq(
      purchaseRefusalOf(error)?.kind,
      "price_changed",
      "a 409 price_changed is a refusal the screen draws",
    );
    eq(
      quoteOf(client),
      fresh,
      "the fresh quote replaces the one on screen — the user confirms the new price",
    );
    eq(
      client.getQueryState(pipelineKeys.catalog())?.isInvalidated,
      true,
      "and the catalog, which priced the card, is read again",
    );
    eq(balanceStale(client), true, "the Balance is read again");
  }

  // A 503: purchases are off for now.
  {
    const { client, purchase } = setup();
    answer = {
      status: 503,
      body: {
        detail: "Reports are briefly unavailable — try again in a minute.",
        error: "purchases_unavailable",
      },
    };
    const { error } = await attempt(purchase);
    eq(
      purchaseRefusalOf(error)?.kind,
      "unavailable",
      "a 503 purchases_unavailable is briefly unavailable",
    );
    eq(quoteOf(client), QUOTE, "the quote on screen is left as it was");
  }

  // An unexplained failure keeps the toast.
  {
    const { purchase } = setup();
    answer = { status: 500, body: { detail: "Internal Server Error" } };
    const { error } = await attempt(purchase);
    eq(
      error instanceof PipelineApiError && purchaseRefusalOf(error),
      null,
      "a 500 is no refusal — the screen keeps its toast for it",
    );
  }

  // A receipt.
  {
    const { client, purchase } = setup();
    answer = {
      status: 200,
      body: {
        purchase_id: "p1",
        run_id: "r1",
        run_status: "queued",
        price_minor: 1000,
        balance_minor: 240,
        charged_minor: 1000,
        can_afford: false,
        shortfall_minor: 760,
        credits_debited: 10,
        balance_credits: 2,
      },
    };
    const { receipt } = await attempt(purchase);
    eq(
      receipt?.run_id,
      "r1",
      "a purchase that goes through returns its receipt",
    );
    eq(balanceStale(client), true, "and the Balance it debited is read again");
  }
}

main()
  .catch((error) => {
    failures++;
    console.log(`FAIL threw: ${error instanceof Error ? error.stack : error}`);
  })
  .finally(() => {
    if (failures > 0) {
      console.log(`\n${failures} failure(s)`);
      process.exit(1);
    }
  });
