/**
 * The connect-card contract (#79): reading `portfolio_connect` off a tool
 * message, the words per reason, where the button goes, and one card per
 * invitation per turn. The block and the copy are shared with finsharpe-mobile
 * (`PortfolioConnect`, `portfolio_connect_card.dart`), so these rules are the
 * web half of that contract.
 */
import {
  connectCardMessages,
  getPortfolioConnect,
  inSentence,
  joinWords,
  parsePortfolioConnect,
  portfolioConnectCopy,
  portfolioConnectKey,
  portfolioConnectNames,
  portfolioConnectTarget,
  type PortfolioConnect,
} from "@/lib/portfolio-connect";

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

const block = (o: Record<string, unknown> = {}) => ({
  reason: "class_not_connected",
  asset_classes: ["MUTUAL_FUNDS"],
  labels: ["Mutual funds"],
  ...o,
});
const toolMessage = (id: string, connect?: unknown) => ({
  type: "tool",
  id,
  tool_call_id: `call-${id}`,
  content: '{"error": "no_portfolio"}',
  additional_kwargs:
    connect === undefined ? {} : { portfolio_connect: connect },
});
const connectOf = (o: Record<string, unknown> = {}) =>
  parsePortfolioConnect(block(o)) as PortfolioConnect;

// --- parse: a valid block --------------------------------------------------
eq(
  parsePortfolioConnect(block()),
  {
    reason: "class_not_connected",
    assetClasses: ["MUTUAL_FUNDS"],
    labels: ["Mutual funds"],
  },
  "valid block parses",
);
for (const reason of ["not_signed_in", "no_consents", "class_not_connected"]) {
  eq(
    parsePortfolioConnect(block({ reason }))?.reason,
    reason,
    `reason ${reason} is accepted`,
  );
}
eq(
  getPortfolioConnect(toolMessage("t1", block()))?.assetClasses,
  ["MUTUAL_FUNDS"],
  "read off additional_kwargs.portfolio_connect",
);
eq(
  parsePortfolioConnect(
    block({ asset_classes: ["ETF", 3, "", null], labels: "ETFs" }),
  ),
  { reason: "class_not_connected", assetClasses: ["ETF"], labels: [] },
  "non-string entries and a non-list are dropped, not fatal",
);

// --- parse: malformed → null -----------------------------------------------
const malformed: [string, unknown][] = [
  ["null", null],
  ["a string", "class_not_connected"],
  ["an array", [block()]],
  ["no reason", { asset_classes: ["ETF"], labels: ["ETFs"] }],
  ["an unknown reason", block({ reason: "consent_expired" })],
  ["a non-string reason", block({ reason: 1 })],
];
for (const [name, raw] of malformed) {
  eq(parsePortfolioConnect(raw), null, `malformed: ${name} → null`);
}
eq(getPortfolioConnect(toolMessage("t2")), null, "no block → null");
eq(
  getPortfolioConnect({ type: "tool", additional_kwargs: "x" }),
  null,
  "non-object additional_kwargs → null",
);
eq(getPortfolioConnect({ type: "tool" }), null, "no additional_kwargs → null");
eq(getPortfolioConnect(undefined), null, "no message → null");

// --- names and casing ------------------------------------------------------
eq(
  portfolioConnectNames(connectOf({ labels: [] })),
  ["MUTUAL_FUNDS"],
  "wire values stand in only when labels are missing",
);
eq(
  ["Mutual funds", "ETFs", "SIPs", "Bank accounts", "Equities"].map(inSentence),
  ["mutual funds", "ETFs", "SIPs", "bank accounts", "equities"],
  "inSentence keeps runs of capitals",
);
eq(
  [[], ["a"], ["a", "b"], ["a", "b", "c"]].map(joinWords),
  ["", "a", "a and b", "a, b and c"],
  "joinWords",
);

// --- copy per reason -------------------------------------------------------
const signIn = portfolioConnectCopy(
  connectOf({
    reason: "not_signed_in",
    asset_classes: ["EQUITIES", "MUTUAL_FUNDS", "ETF", "BANK_ACCOUNTS", "SIP"],
    labels: ["Equities", "Mutual funds", "ETFs", "Bank accounts", "SIPs"],
  }),
);
eq(
  [signIn.title, signIn.cta, signIn.chips.length],
  ["Sign in to ask about your portfolio", "Sign in", 5],
  "not_signed_in copy",
);
const none = portfolioConnectCopy(
  connectOf({
    reason: "no_consents",
    asset_classes: ["EQUITIES", "ETF"],
    labels: ["Equities", "ETFs"],
  }),
);
eq(
  [none.title, none.cta, none.chips],
  [
    "Connect your accounts to ask about your portfolio",
    "Connect via OneMoney",
    ["Equities", "ETFs"],
  ],
  "no_consents copy, chips for several classes",
);
const one = portfolioConnectCopy(connectOf());
eq(
  [one.title, one.cta, one.chips],
  ["Connect your mutual funds to ask about them", "Connect via OneMoney", []],
  "class_not_connected, one class: named in the title, no chip",
);
eq(
  portfolioConnectCopy(
    connectOf({ asset_classes: ["ETF", "SIP"], labels: ["ETFs", "SIPs"] }),
  ).title,
  "Connect your ETFs and SIPs to ask about them",
  "class_not_connected, two classes",
);
eq(
  portfolioConnectCopy(connectOf({ asset_classes: [], labels: [] })).title,
  "Connect your accounts to ask about your portfolio",
  "class_not_connected with no class falls back to the generic title",
);

// --- where the button goes -------------------------------------------------
eq(
  portfolioConnectTarget(connectOf({ reason: "not_signed_in" })),
  { kind: "sign-in" },
  "not_signed_in → sign in",
);
eq(
  portfolioConnectTarget(connectOf()),
  { kind: "class", type: "MUTUAL_FUNDS" },
  "one known class → that class's form",
);
eq(
  portfolioConnectTarget(
    connectOf({ reason: "no_consents", asset_classes: ["ETF"] }),
  ),
  { kind: "class", type: "ETF" },
  "no_consents naming one class → that class's form",
);
eq(
  portfolioConnectTarget(connectOf({ asset_classes: ["NPS"] })),
  { kind: "picker" },
  "one class this build does not know → picker, not a dead link",
);
eq(
  portfolioConnectTarget(connectOf({ asset_classes: ["ETF", "SIP"] })),
  { kind: "picker" },
  "several classes → picker",
);
eq(
  portfolioConnectTarget(connectOf({ asset_classes: [] })),
  { kind: "picker" },
  "no class → picker",
);

// --- one card per invitation per turn --------------------------------------
eq(
  portfolioConnectKey(connectOf({ asset_classes: ["ETF"] })),
  "class_not_connected|ETF",
  "key",
);
const human = (id: string) => ({ type: "human", id });
const ai = (id: string) => ({ type: "ai", id });
const etf = block({ asset_classes: ["ETF"], labels: ["ETFs"] });
const turn = [
  human("h1"),
  ai("a1"),
  toolMessage("get", etf),
  toolMessage("analyze", etf),
  toolMessage("sip", block({ asset_classes: ["SIP"], labels: ["SIPs"] })),
  toolMessage("plain"),
  ai("a2"),
  human("h2"),
  ai("a3"),
  toolMessage("again", etf),
];
eq(
  [...connectCardMessages(turn)].map((m) => m.id),
  ["get", "sip", "again"],
  "same block twice in a turn draws once; a different one and the next turn draw",
);

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
