/**
 * Import hand-offs send the request, not the holdings (#85). The sentences are
 * shared with finsharpe-mobile (`chat_messages.dart`, #171) and named by the
 * agent's playbook, so these cases are the web half of that contract.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import {
  comprehensiveAnalysisMessage,
  fundamentalSignalMessage,
  holdingsAnalysisMessage,
  signalSymbol,
  SIP_ANALYSIS_MESSAGE,
  technicalSignalMessage,
} from "@/modules/import-data/utils/chat-handoffs";
import {
  holdingsNewsSubtitle,
  quietHoldingLabel,
  quietHoldingsLine,
  splitSource,
} from "@/modules/import-data/utils/holdings-news";
import { NewsFeedPager } from "@/modules/discover/utils/news-feed";
import type { MarketNewsItem } from "@/modules/discover/api/market-news";

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

// Copy matches mobile byte for byte.
eq(
  holdingsAnalysisMessage(ConsentType.EQUITIES),
  "Analyse my equities.",
  "equities",
);
eq(
  holdingsAnalysisMessage(ConsentType.MUTUAL_FUNDS),
  "Analyse my mutual funds.",
  "mutual funds",
);
eq(holdingsAnalysisMessage(ConsentType.ETF), "Analyse my ETFs.", "ETFs");
eq(SIP_ANALYSIS_MESSAGE, "Analyse my SIPs.", "SIPs");

const COMPREHENSIVE = "Give me a comprehensive analysis of my portfolio.";
eq(
  comprehensiveAnalysisMessage([{ type: "MUTUAL_FUNDS", count: 3 }]),
  COMPREHENSIVE,
  "comprehensive: one investment class with holdings",
);
eq(
  comprehensiveAnalysisMessage([
    { type: "EQUITIES", count: 0 },
    { type: "BANK_ACCOUNTS", count: 2 },
    { type: "SIP", count: 4 },
  ]),
  null,
  "comprehensive: bank and SIPs alone are no book to analyse",
);
eq(comprehensiveAnalysisMessage([]), null, "comprehensive: nothing connected");

// Deep Dive `Ask AI` — mobile's `technicalSignalMessage` /
// `fundamentalSignalMessage` (#140, #170), byte for byte.
eq(
  technicalSignalMessage({
    symbol: "TCS",
    badge: "Bullish",
    line: "Golden Cross formed, RSI at 62",
  }),
  "Explain this technical signal on TCS: Bullish — Golden Cross formed, RSI at 62. What does it mean for my TCS position, and what should I watch next?",
  "technical: verdict and line, full stop added",
);
eq(
  technicalSignalMessage({
    symbol: "TCS",
    badge: null,
    line: "Above its 200 DMA!",
  }),
  "Explain this technical signal on TCS: Above its 200 DMA! What does it mean for my TCS position, and what should I watch next?",
  "technical: line alone keeps its own punctuation",
);
eq(
  fundamentalSignalMessage({ symbol: "INFY", badge: "  ", line: undefined }),
  "Explain this fundamental signal on INFY. How does it compare with peers, and what does it mean for my INFY holding?",
  "fundamental: nothing served, nothing invented",
);
eq(
  fundamentalSignalMessage({
    symbol: "HDFCBANK",
    badge: "Strong",
    line: "ROE 17%.",
  }),
  "Explain this fundamental signal on HDFCBANK: Strong — ROE 17%. How does it compare with peers, and what does it mean for my HDFCBANK holding?",
  "fundamental: verdict and line",
);
eq(
  signalSymbol({ symbol: null, name: "Parag Parikh Flexi Cap", isin: "INF" }),
  "Parag Parikh Flexi Cap",
  "symbol falls back to name",
);
eq(
  signalSymbol({ isin: "INE467B01029" }),
  "INE467B01029",
  "symbol falls back to ISIN",
);

// Holdings news splits the publisher off the last " - " only.
eq(
  splitSource("Vi ARPU grows 8.3% - ahead of Airtel - telecomtalk.info"),
  ["Vi ARPU grows 8.3% - ahead of Airtel", "telecomtalk.info"],
  "news: last separator is the publisher",
);
eq(
  splitSource("Markets end flat - what next?"),
  ["Markets end flat - what next?", null],
  "news: punctuated tail stays",
);
eq(
  splitSource("No publisher here"),
  ["No publisher here", null],
  "news: no separator",
);

// Holdings news end line and subtitle (#174), as mobile words them.
eq(quietHoldingsLine([]), null, "quiet: none");
eq(quietHoldingsLine(["LT"]), "Nothing on LT in that time.", "quiet: one");
eq(
  quietHoldingsLine(["LT", "ETERNAL", "ITC"]),
  "Nothing on LT, ETERNAL or ITC in that time.",
  "quiet: several",
);
eq(
  quietHoldingLabel({
    isin: "X",
    symbol: "ONGC",
    name: "OIL AND NATURAL GAS CORPORATION LTD",
  }),
  "ONGC",
  "quiet label: symbol first",
);
eq(
  quietHoldingLabel({ isin: "X", name: "Tata Motors Limited" }),
  "Tata Motors",
  "quiet label: short name",
);
eq(
  holdingsNewsSubtitle(1),
  "Your largest stock · last 7 days",
  "subtitle: one",
);
eq(
  holdingsNewsSubtitle(7),
  "Your 7 largest stocks · last 7 days",
  "subtitle: several",
);

// The pager: dedup, empty-page chaining, stall, failure, end.
const item = (id: string) => ({ id }) as MarketNewsItem;
async function pagerChecks() {
  const pages: Record<
    number,
    { items: MarketNewsItem[]; next: number | null } | "fail"
  > = {
    2: { items: [item("a"), item("c")], next: 3 },
    3: { items: [], next: 4 },
    4: "fail",
  };
  const pager = new NewsFeedPager<number>(async (c) => {
    const p = pages[c];
    if (p === "fail" || !p) throw new Error("down");
    return p;
  });
  let st = pager.start({
    items: [item("a"), item("b")],
    next: 2,
    quiet: ["LT"],
  });
  eq([st.foot, st.firstPageCount], ["more", 2], "pager: page 1");
  st = await pager.more(st);
  eq(
    [st.items.map((i) => i.id), st.foot],
    [["a", "b", "c"], "more"],
    "pager: dedups on id",
  );
  st = await pager.more(st);
  eq(
    [st.items.length, st.foot, st.quiet],
    [3, "failed", ["LT"]],
    "pager: empty page chains on, a failure keeps the cards",
  );
  pages[4] = { items: [], next: 5 };
  pages[5] = { items: [], next: 6 };
  pages[6] = { items: [], next: 7 };
  st = await pager.more(st);
  eq(st.foot, "stalled", "pager: three empty pages stop at Show more");
  pages[7] = { items: [item("d")], next: null };
  st = await pager.more(st);
  eq(
    [st.items.length, st.foot, st.firstPageCount],
    [4, "end", 2],
    "pager: last page ends",
  );
  eq(pager.canLoad(st), false, "pager: nothing after the end");
}

// The hooks send those sentences and never paste a table again.
// `pnpm check` runs from the repo root; the bundle itself lives in a temp dir.
const root = process.cwd();
const hooks = [
  "src/modules/import-data/hooks/useComprehensiveAnalysisMutation.ts",
  "src/modules/import-data/hooks/useImportHoldingsMutation.ts",
  "src/modules/import-data/components/modals/SipPreviewModal/hooks/useImportSipMutation.ts",
];
for (const hook of hooks) {
  const source = readFileSync(join(root, hook), "utf8");
  eq(
    /convertToMarkdownTable|MarkdownFormat|getFiData|ISIN/.test(source),
    false,
    `${hook.split("/").pop()} builds no table and fetches no FI data`,
  );
}

void pagerChecks().then(() => {
  if (failures > 0) {
    console.log(`\n${failures} failure(s)`);
    process.exit(1);
  }
});
