/**
 * The tool-activity contract shared with finsharpe-mobile (`tool_activity.dart`,
 * `tool_labels.dart`): how a turn's calls group, and what each row is called.
 */
import type { Message } from "@langchain/langgraph-sdk";
import { formatToolName } from "@/components/thread/messages/tool-labels";
import { currentStep, projectTurn, splitTurns } from "@/lib/tool-activity";

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

const ai = (id: string, content: string, calls: string[] = []) =>
  ({
    type: "ai",
    id,
    content,
    tool_calls: calls.map((c) => ({ name: c, id: `c-${c}`, args: {} })),
  }) as unknown as Message;
const tool = (call: string, extra: Record<string, unknown> = {}) =>
  ({
    type: "tool",
    id: `t-${call}`,
    tool_call_id: `c-${call}`,
    content: "{}",
    ...extra,
  }) as unknown as Message;

const project = (turn: Message[]) =>
  projectTurn(turn, {
    isMessageVisible: (m) => String(m.content).trim().length > 0,
    isToolBoundary: (m) => !!m.additional_kwargs?.mcp_app,
  });
const shape = (turn: Message[]) =>
  project(turn).map((p) =>
    p.kind === "tools" ? `tools(${p.steps.map((s) => s.call.name)})` : p.key,
  );

eq(
  shape([
    ai("a1", "", ["scan"]),
    tool("scan"),
    ai("a2", "", ["call_api"]),
    tool("call_api"),
    ai("a3", "Answer"),
  ]),
  ["tools(scan,call_api)", "message:a1", "message:a2", "message:a3"],
  "consecutive tool rounds share one group; silent messages follow it",
);
eq(
  shape([
    ai("a1", "Let me look", ["scan"]),
    tool("scan"),
    ai("a2", "Found it", ["call_api"]),
  ]),
  ["message:a1", "tools(scan)", "message:a2", "tools(call_api)"],
  "prose closes the group",
);
eq(
  shape([
    ai("a1", "", ["render_stock_report"]),
    tool("render_stock_report", { additional_kwargs: { mcp_app: {} } }),
    ai("a2", "Here it is"),
  ]),
  [
    "tools(render_stock_report)",
    "message:a1",
    "message:t-render_stock_report",
    "message:a2",
  ],
  "a report closes the group and keeps its call in the record",
);
const steps = project([
  ai("a1", "", ["scan", "call_api"]),
  tool("call_api"),
])[0];
eq(
  steps.kind === "tools" && currentStep(steps.steps)?.call.name,
  "scan",
  "results pair by id; the first unanswered call is the current one",
);
const hidden = project([
  ai("a1", "", ["scan"]),
  tool("scan", { id: "do-not-render-x" }),
])[0];
eq(
  hidden.kind === "tools" && !!hidden.steps[0].result,
  false,
  "a client-made result is not a response",
);
eq(
  splitTurns([
    { type: "human", id: "h1", content: "q" } as Message,
    ai("a1", "x"),
    { type: "human", id: "h2", content: "q" } as Message,
  ]).map((t) => [t.human?.id, t.turn.length]),
  [
    ["h1", 1],
    ["h2", 0],
  ],
  "turns split at each human message",
);

eq(formatToolName("scan"), "Scan the market", "resting row: stable name");
eq(
  formatToolName("scan", { active: true }),
  "Scanning the market",
  "active row: narration",
);
eq(
  formatToolName("mf_top_holdings"),
  "MF Top Holdings",
  "uncurated: acronyms shout",
);
eq(
  formatToolName("render_api_report", { active: true }),
  "Building the API report",
  "uncurated render_ tool",
);
eq(formatToolName("  "), "Retrieve data", "nameless call");

if (failures > 0) {
  console.log(`\n${failures} failed`);
  process.exit(1);
}
