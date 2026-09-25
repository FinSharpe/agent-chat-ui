/**
 * The Credits surfaces as they render (finsharpe-agents#280), in every state
 * #279 lists: the Balance headline at, below and gated below zero; the flat
 * History with its tones and its taps; the empty History; the quote short,
 * affordable and refused, and what a screen reader hears when a 402 re-draws
 * it; the Profile's Credits row, a link with no figure. Rendered to static
 * markup, so what is checked is what a reader would be shown.
 *
 * And across all of it: no USD figure, no rate and no token count (B6).
 */

import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";

import type { QuoteResponse } from "@/api/generated/pipelines-apis/models";
import { AccountDestinationsSection } from "@/modules/account/components/shared/AccountActionRows";
import { BalanceHeadline } from "@/modules/credits/components/BalanceHeadline";
import {
  HistoryEmpty,
  HistoryList,
} from "@/modules/credits/components/HistoryList";
import { creditKeys } from "@/modules/credits/hooks/useCredits";
import { historyRowView } from "@/modules/credits/utils/history";
import { creditRequestHref } from "@/modules/credits/utils/request";
import { QuoteDetails } from "@/modules/pipelines/components/quote/QuoteDetails";
import { StatStrip } from "@/modules/pipelines/components/shared/kit";
import { AuthProvider } from "@/providers/AuthProvider";

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
function html(node: React.ReactElement): string {
  const markup = renderToStaticMarkup(node);
  rendered.push(markup);
  return markup;
}
/** The text a reader sees: markup without tags, entities decoded. */
function text(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const USED_UP =
  "Your credits are used up. Chat is paused until more are added.";
const BELOW = "Your balance is below zero.";

/* -------------------------------------------------------------------------- */
/* The Balance headline                                                        */
/* -------------------------------------------------------------------------- */

const hrefFor = (balanceMinor: number) =>
  creditRequestHref({ email: "ada@example.com", balanceMinor });

const positive = html(
  <BalanceHeadline
    credits={{ balance_minor: 1240, gated: false }}
    requestHref={hrefFor(1240)}
  />,
);
eq(
  [
    text(positive).includes("12.40 credits"),
    text(positive).includes("Request credits"),
    text(positive).includes(BELOW),
    text(positive).includes(USED_UP),
  ],
  [true, true, false, false],
  "at or above zero: the figure and the request, no state line",
);
eq(
  positive.includes(
    'href="mailto:info@finsharpe.com?subject=FinSharpe%20credits%20request',
  ),
  true,
  "Request credits opens the prefilled email",
);

const below = html(
  <BalanceHeadline
    credits={{ balance_minor: -1310, gated: false }}
    requestHref={hrefFor(-1310)}
  />,
);
eq(
  [
    text(below).includes("−13.10 credits"),
    text(below).includes(BELOW),
    text(below).includes(USED_UP),
    text(below).includes("Request credits"),
    /rose/.test(below),
  ],
  [true, true, false, true, false],
  "below zero, not refused: the true figure and the line, no notice, no rose",
);

const gated = html(
  <BalanceHeadline
    credits={{ balance_minor: -1310, gated: true }}
    requestHref={hrefFor(-1310)}
  />,
);
eq(
  [
    text(gated).includes("−13.10 credits"),
    text(gated).includes(USED_UP),
    text(gated).includes(BELOW),
    /role="status"[^]*Request credits/.test(gated),
  ],
  [true, true, false, true],
  "gated: the Short Balance notice with the request inside it",
);

/* -------------------------------------------------------------------------- */
/* The History                                                                 */
/* -------------------------------------------------------------------------- */

const NOW = new Date("2026-09-25T09:00:00Z");
const TITLES = new Map([["t1", "Reliance results"]]);
const base = {
  status: "closed" as const,
  title: null,
  turn_id: null,
  thread_id: null,
  closes_at: null,
  terminal_status: null,
  purchase_id: null,
  run_id: null,
};
const rows = [
  {
    ...base,
    kind: "turn" as const,
    occurred_at: "2026-09-25T08:32:00Z",
    amount_minor: -42,
    thread_id: "t1",
    status: "open" as const,
    closes_at: "2026-09-26T08:32:00Z",
  },
  {
    ...base,
    kind: "turn" as const,
    occurred_at: "2026-09-25T07:00:00Z",
    amount_minor: -18,
    thread_id: "gone",
  },
  {
    ...base,
    kind: "purchase" as const,
    occurred_at: "2026-09-24T05:50:00Z",
    amount_minor: -1000,
    title: "Stock Deep Dive · TCS",
    run_id: "r1",
  },
  {
    ...base,
    kind: "allotment" as const,
    occurred_at: "2026-09-20T04:30:00Z",
    amount_minor: 2000,
    title: "Starting credits",
  },
].map((entry, index) =>
  historyRowView(entry, { threadTitles: TITLES, now: NOW, index }),
);
const list = html(
  <HistoryList
    rows={rows}
    onOpen={() => {}}
  />,
);
eq(
  (list.match(/<ul/g) ?? []).length,
  1,
  "the History is one flat list — no day groups",
);
eq((list.match(/<li/g) ?? []).length, 4, "one item per entry");
eq(
  [...list.matchAll(/data-tone="(\w+)"[^>]*>([^<]+)</g)].map((m) => [
    m[1],
    m[2],
  ]),
  [
    ["ink", "−0.42"],
    ["ink", "−0.18"],
    ["ink", "−10.00"],
    ["positive", "+20.00"],
  ],
  "Charges in ink, the Allotment in positive green, newest first",
);
eq(
  /#0A9E6E/.test(list) && !/rose/.test(list),
  true,
  "positive is the green token; nothing is rose",
);
eq(
  (list.match(/<button/g) ?? []).length,
  2,
  "the chat with a thread and the report open; the rest do not",
);
eq(
  text(list).includes("may adjust until tomorrow 14:02") &&
    text(list).includes("Chat"),
  true,
  "an open turn's window, and a gone thread titled Chat",
);
eq(
  /after|balance/i.test(text(list)),
  false,
  "no running Balance on any row (J8)",
);

const empty = html(<HistoryEmpty />);
eq(
  text(empty),
  "Nothing here yet Credits added to your account and credits you use will be listed here.",
  "an empty History says so",
);
// True in Shadow Mode, where a non-staff History holds no chat turns, and
// after enforcement, where it does: the sentence names no kind of row.
eq(
  /\b(chats?|reports?|refunds?|turns?)\b/i.test(text(empty)),
  false,
  "and says it without naming which rows the History will hold",
);

/* -------------------------------------------------------------------------- */
/* The quote                                                                   */
/* -------------------------------------------------------------------------- */

const QUOTE: QuoteResponse = {
  price_minor: 1000,
  balance_minor: 340,
  charged_minor: 1000,
  can_afford: false,
  shortfall_minor: 660,
  pipeline_id: "stock-deep-dive",
  pipeline_version: 1,
  target: { symbol: "TCS" } as QuoteResponse["target"],
  target_key: "TCS",
  vintage_map: {},
  coverage_gaps: [],
  price_credits: 10,
  balance_credits: 3,
  instant_reuse: false,
};
const SHORTFALL =
  "You need 6.60 credits more to commission this report. You can request more from the Credits screen.";

const shortQuote = html(
  <QuoteDetails
    quote={QUOTE}
    subject="stock"
  />,
);
eq(
  text(shortQuote).includes(SHORTFALL),
  true,
  "short: the rose notice carries #229's sentence",
);
eq(/text-rose-500/.test(shortQuote), true, "and it is rose");
eq(
  /mailto|Request credits|<a /.test(shortQuote),
  false,
  "the quote names the Credits screen and offers no action (ADR-0013)",
);

const affordable = html(
  <QuoteDetails
    quote={{
      ...QUOTE,
      balance_minor: 1240,
      can_afford: true,
      shortfall_minor: 0,
    }}
    subject="stock"
  />,
);
eq(text(affordable).includes("You need"), false, "affordable: no shortfall");

const inconsistent = html(
  <QuoteDetails
    quote={{ ...QUOTE, can_afford: true }}
    subject="stock"
  />,
);
eq(
  text(inconsistent).includes("You need"),
  false,
  "can_afford is the server's: a covering verdict shows no shortfall",
);

const movedQuote = html(
  <QuoteDetails
    quote={{
      ...QUOTE,
      price_minor: 1200,
      balance_minor: 1240,
      can_afford: true,
      shortfall_minor: 0,
    }}
    subject="stock"
    refusal="price_changed"
  />,
);
eq(
  text(movedQuote).includes(
    "The price of this report has changed. Nothing was charged — check the new price, then run it again.",
  ),
  true,
  "a 409 is said on the screen",
);
eq(/has changed to/.test(movedQuote), false, "and never in the server's words");

const offQuote = html(
  <QuoteDetails
    quote={{
      ...QUOTE,
      balance_minor: 1240,
      can_afford: true,
      shortfall_minor: 0,
    }}
    subject="stock"
    refusal="unavailable"
  />,
);
eq(
  text(offQuote).includes(
    "Reports are briefly unavailable — try again in a minute.",
  ),
  true,
  "a 503 purchases_unavailable is briefly unavailable",
);

const shortRefused = html(
  <QuoteDetails
    quote={QUOTE}
    subject="stock"
    refusal="short_balance"
  />,
);
eq(
  [
    text(shortRefused).includes(SHORTFALL),
    /data-testid="purchase-refusal"/.test(shortRefused),
  ],
  [true, false],
  "a 402 renders as the short-balance state, with no notice of its own",
);

/** The quote's live region: whether it is polite, and what it says. */
function announcer(markup: string) {
  const tag = markup.match(
    /<p[^>]*data-testid="quote-announcer"[^>]*>([^<]*)<\/p>/,
  );
  return tag
    ? {
        polite:
          /role="status"/.test(tag[0]) && /aria-live="polite"/.test(tag[0]),
        said: tag[1],
      }
    : null;
}
eq(
  announcer(affordable),
  { polite: true, said: "" },
  "before any purchase the quote holds an empty polite live region",
);
eq(
  announcer(shortRefused),
  { polite: true, said: SHORTFALL },
  "a 402 fills it with the short-balance sentence, so a screen reader hears it",
);
eq(
  announcer(shortQuote)?.said,
  "",
  "a quote that loads short is read with the page, not announced",
);
eq(
  [announcer(movedQuote)?.said, announcer(offQuote)?.said],
  ["", ""],
  "a 409 or 503 is not said twice: its notice is its own status",
);

const strip = html(
  <StatStrip
    stats={[
      { label: "Price", value: "10 credits" },
      { label: "Your Balance", value: "−13.10 credits", negative: true },
      { label: "Sections", value: "8" },
    ]}
  />,
);
eq(
  /class="[^"]*text-rose-500[^"]*">−13\.10 credits/.test(strip),
  true,
  "a Balance short of the price shows its true figure in rose",
);

/* -------------------------------------------------------------------------- */
/* Where the figure lives (owner, 2026-09-25)                                  */
/* -------------------------------------------------------------------------- */

// The sidebar footer and the phone account sheet show the Balance; Profile's
// Credits row is a link to the Credits page and nothing more. The row is
// drawn as Profile draws it, with a Balance in the cache: a static render has
// nobody signed in, so a figure there would read the anonymous key.
const accountClient = new QueryClient();
accountClient.setQueryData(creditKeys.balance(""), {
  balance_minor: 1240,
  gated: false,
});
const router = {
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
} as unknown as AppRouterInstance;
const profile = html(
  <AppRouterContext.Provider value={router}>
    <AuthProvider>
      <QueryClientProvider client={accountClient}>
        <AccountDestinationsSection onLeave={() => {}} />
      </QueryClientProvider>
    </AuthProvider>
  </AppRouterContext.Provider>,
);
eq(
  [
    (profile.match(/<button/g) ?? []).length,
    text(profile).includes("Credits Your balance, history and requests"),
    text(profile).includes("MCP Access"),
  ],
  [2, true, true],
  "Profile keeps a Credits row beside MCP Access",
);
eq(
  [
    /credits-figure/.test(profile),
    text(profile).includes("12.40"),
    /animate-pulse/.test(profile),
    text(profile).includes("—"),
  ],
  [false, false, false, false],
  "and the row carries no figure: no Balance, no skeleton, no dash",
);
const source = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");
eq(
  [
    "src/modules/shell/components/SidebarAccountFooter.tsx",
    "src/modules/shell/components/MobileAccountMenu.tsx",
    "src/modules/account/components/shared/AccountActionRows.tsx",
  ].map((path) => /<CreditsFigure\b/.test(source(path))),
  [true, true, false],
  "the figure is drawn in the sidebar footer and the phone sheet only",
);

/* -------------------------------------------------------------------------- */
/* No currency, rate or token count (B6)                                       */
/* -------------------------------------------------------------------------- */

const MONEY = /\$|₹|\b(usd|inr|dollars?|rupees?|rates?|tokens?|costs?)\b/i;
eq(
  rendered.map(text).filter((t) => MONEY.test(t)),
  [],
  "nothing rendered names a currency, a rate or a token count",
);

if (failures > 0) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
