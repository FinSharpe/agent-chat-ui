/**
 * The Balance and the History as the Credits page reads them
 * (finsharpe-agents#280, on #269's `/api/me/credits`): through the real
 * generated client, query options and cache, with `fetch` stubbed as the
 * `/api/utilities` proxy would answer.
 *
 * - the first History page is asked for with no cursor — never the string
 *   "null" the generated URL builder would send — and each next page with the
 *   cursor the last one returned, newest first, until there is none;
 * - a Balance that fails is an error, never a zero;
 * - a refresh marks every Credits read stale (the carrier and the purchase
 *   both call it).
 */

import { QueryClient } from "@tanstack/react-query";

import type {
  UserCreditHistoryEntry,
  UserCreditHistoryPage,
} from "@/api/generated/credits-apis/models";
import {
  CreditsApiError,
  HISTORY_PAGE_SIZE,
} from "@/modules/credits/api/credits-client";
import {
  creditBalanceQuery,
  creditHistoryQuery,
  creditKeys,
  refreshCredits,
} from "@/modules/credits/hooks/useCredits";
import { historyEntries } from "@/modules/credits/utils/history";

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

const entry = (
  occurred_at: string,
  amount_minor: number,
): UserCreditHistoryEntry => ({
  kind: "turn",
  occurred_at,
  amount_minor,
  status: "closed",
  title: null,
  turn_id: `run-${occurred_at}`,
  thread_id: null,
  closes_at: null,
  terminal_status: null,
  purchase_id: null,
  run_id: null,
});

// Three pages, newest first, walked by an opaque cursor.
const PAGES: Record<string, UserCreditHistoryPage> = {
  "": {
    entries: [
      entry("2026-09-25T08:00:00Z", -42),
      entry("2026-09-25T07:00:00Z", -18),
    ],
    next_cursor: "c1",
  },
  c1: { entries: [entry("2026-09-24T08:00:00Z", -1000)], next_cursor: "c2" },
  c2: { entries: [entry("2026-09-20T08:00:00Z", 2000)], next_cursor: null },
};

const urls: string[] = [];
let balanceStatus = 200;
globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input);
  urls.push(url);
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  if (url === "/api/utilities/me/credits") {
    return balanceStatus === 200
      ? json(200, { balance_minor: -1310, gated: false })
      : json(balanceStatus, { detail: "Internal Server Error" });
  }
  if (url.startsWith("/api/utilities/me/credits/history?")) {
    const params = new URL(url, "http://x").searchParams;
    const cursor = params.get("cursor") ?? "";
    const page = PAGES[cursor];
    return page ? json(200, page) : json(400, { detail: "Invalid cursor" });
  }
  throw new Error(`unexpected fetch ${url}`);
}) as typeof fetch;

const newClient = () =>
  new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } },
  });

async function main() {
  const client = newClient();

  // The Balance.
  const credits = await client.fetchQuery(creditBalanceQuery("u1"));
  eq(
    credits,
    { balance_minor: -1310, gated: false },
    "the Balance reads the minor-unit wire as is",
  );

  balanceStatus = 500;
  const failing = newClient();
  const failed = await failing.fetchQuery(creditBalanceQuery("u1")).then(
    () => null,
    (error: unknown) => error,
  );
  eq(
    failed instanceof CreditsApiError && failed.status,
    500,
    "a Balance that fails is an error — the page shows it failed, never 0.00",
  );
  eq(
    failing.getQueryData(creditKeys.balance("u1")),
    undefined,
    "and nothing is cached as a Balance",
  );
  balanceStatus = 200;

  // The History, paged newest first.
  urls.length = 0;
  const history = await client.fetchInfiniteQuery({
    ...creditHistoryQuery("u1"),
    pages: 5,
  });
  const historyUrls = urls.filter((u) => u.includes("/history"));
  eq(
    historyUrls,
    [
      `/api/utilities/me/credits/history?limit=${HISTORY_PAGE_SIZE}`,
      `/api/utilities/me/credits/history?limit=${HISTORY_PAGE_SIZE}&cursor=c1`,
      `/api/utilities/me/credits/history?limit=${HISTORY_PAGE_SIZE}&cursor=c2`,
    ],
    "the first page has no cursor; each next page the cursor the last returned; none past the end",
  );
  eq(
    historyUrls.some((u) => u.includes("null")),
    false,
    "a null cursor is never sent as a string",
  );
  eq(
    historyEntries(history.pages).map((e) => e.amount_minor),
    [-42, -18, -1000, 2000],
    "every page, newest first, in the order the server sent",
  );
  eq(
    history.pageParams,
    [null, "c1", "c2"],
    "page params walk the server's cursors",
  );

  // One page at a time, as "Show older" asks.
  urls.length = 0;
  const stepwise = newClient();
  const first = await stepwise.fetchInfiniteQuery(creditHistoryQuery("u1"));
  eq(first.pages.length, 1, "the page opens on one page");
  const next = creditHistoryQuery("u1").getNextPageParam(
    first.pages[first.pages.length - 1],
    first.pages,
    first.pageParams[first.pageParams.length - 1],
    first.pageParams,
  );
  eq(next, "c1", "Show older has a page to ask for");
  const last = creditHistoryQuery("u1").getNextPageParam(
    PAGES.c2,
    [],
    "c2",
    [],
  );
  eq(last, undefined, "the last page has none — Show older goes away");

  // A refresh marks every Credits read stale.
  await refreshCredits(client);
  eq(
    [
      client.getQueryState(creditKeys.balance("u1"))?.isInvalidated,
      client.getQueryState(creditKeys.history("u1"))?.isInvalidated,
    ],
    [true, true],
    "refreshCredits marks the Balance and the History stale",
  );
  eq(
    creditBalanceQuery("u1").refetchOnMount,
    "always",
    "every Balance observer reads afresh when it mounts (an account surface opening)",
  );
  eq(
    creditHistoryQuery("u1").refetchOnMount,
    "always",
    "the History reads afresh when the Credits page opens",
  );
  eq(
    creditKeys.balance("u1")[1] !== creditKeys.balance("u2")[1],
    true,
    "the Balance is cached per account",
  );
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
