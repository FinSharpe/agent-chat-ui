/**
 * The connect card as rendered, one case per `reason`, plus the tool row it
 * answers for and the thread the consent journey carries back.
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PortfolioConnectCardView } from "@/components/thread/messages/portfolio-connect/PortfolioConnectCardView";
import { ToolCallGroup } from "@/components/thread/messages/tool-call-group";
import { parsePortfolioConnect } from "@/lib/portfolio-connect";
import {
  readPendingJourney,
  writePendingJourney,
} from "@/modules/import-data/utils/aa-pending";

let failures = 0;
function check(ok: boolean, name: string, html?: string) {
  if (ok) {
    console.log(`ok   ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}${html ? `\n  ${html}` : ""}`);
  }
}

const ALL = {
  asset_classes: ["EQUITIES", "MUTUAL_FUNDS", "ETF", "BANK_ACCOUNTS", "SIP"],
  labels: ["Equities", "Mutual funds", "ETFs", "Bank accounts", "SIPs"],
};

function card(raw: Record<string, unknown>) {
  const connect = parsePortfolioConnect(raw);
  if (!connect) throw new Error("fixture did not parse");
  return renderToStaticMarkup(
    <PortfolioConnectCardView
      connect={connect}
      onAction={() => {}}
    />,
  );
}

// not_signed_in: a sign-in button, no OneMoney button.
{
  const html = card({ reason: "not_signed_in", ...ALL });
  check(
    html.includes('data-portfolio-connect="not_signed_in"'),
    "not_signed_in: tagged",
    html,
  );
  check(
    html.includes("Sign in to ask about your portfolio"),
    "not_signed_in: title",
    html,
  );
  check(
    /<button[^>]*>.*Sign in<\/button>/.test(html),
    "not_signed_in: Sign in CTA",
    html,
  );
  check(
    !html.includes("Connect via OneMoney"),
    "not_signed_in: no connect CTA",
    html,
  );
  check(
    html.includes("bring you right back to this thread"),
    "not_signed_in: says it returns",
    html,
  );
}

// no_consents: generic title, a chip per class, the connect CTA.
{
  const html = card({ reason: "no_consents", ...ALL });
  check(
    html.includes("Connect your accounts to ask about your portfolio"),
    "no_consents: title",
    html,
  );
  const chips = html.match(/<li[^>]*>[^<]*<\/li>/g) ?? [];
  check(
    chips.length === 5,
    `no_consents: five chips (got ${chips.length})`,
    html,
  );
  check(
    ALL.labels.every((label) => html.includes(`>${label}</li>`)),
    "no_consents: chips print the server's labels",
    html,
  );
  check(
    html.includes("Connect via OneMoney"),
    "no_consents: connect CTA",
    html,
  );
}

// class_not_connected: the class in the title, no chip, the connect CTA.
{
  const html = card({
    reason: "class_not_connected",
    asset_classes: ["ETF"],
    labels: ["ETFs"],
  });
  check(
    html.includes("Connect your ETFs to ask about them"),
    "class_not_connected: class named in title",
    html,
  );
  check(
    !/<li[\s>]/.test(html),
    "class_not_connected: one class, no chip",
    html,
  );
  check(
    html.includes("Connect via OneMoney"),
    "class_not_connected: connect CTA",
    html,
  );
  check(
    !html.includes("no_portfolio"),
    "class_not_connected: no raw tool JSON",
    html,
  );
}

// The tool row the card answers for: done, not failed, whatever the payload.
{
  const html = renderToStaticMarkup(
    <ToolCallGroup
      phase="settled"
      steps={[
        {
          key: "call-1",
          call: {
            name: "analyze_user_portfolio",
            id: "call-1",
            args: { asset_class: "ETF" },
            type: "tool_call",
          },
          result: {
            type: "tool",
            id: "tool-1",
            tool_call_id: "call-1",
            status: "error",
            content:
              '{"error": "no_portfolio", "reason": "class_not_connected"}',
            additional_kwargs: {
              portfolio_connect: {
                reason: "class_not_connected",
                asset_classes: ["ETF"],
                labels: ["ETFs"],
              },
            },
          } as never,
        },
      ]}
    />,
  );
  check(
    html.includes("Analyze your portfolio"),
    "tool row: labelled for the reader",
    html,
  );
  check(
    !html.includes("failed") && !html.includes("tool-words--warning"),
    "tool row: not drawn as failed",
    html,
  );
  check(!html.includes("<button"), "tool row: does not open", html);
}

// The thread a journey carries back through sessionStorage is vetted on read.
{
  const store = new Map<string, string>();
  const g = globalThis as Record<string, unknown>;
  g.window = globalThis;
  g.sessionStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };
  // The module reads `window` when called, not when loaded, so stubbing it
  // here is in time.
  const journey = (returnTo?: string) => ({
    type: "ETF" as const,
    consentHandle: "h",
    accountID: "a",
    mobileNo: "9999999999",
    startedAt: Date.now(),
    returnTo,
  });

  writePendingJourney(journey("/?threadId=abc"));
  check(
    readPendingJourney()?.returnTo === "/?threadId=abc",
    "journey: a thread path comes back",
  );
  writePendingJourney(journey("//evil.example"));
  check(
    readPendingJourney()?.returnTo === undefined,
    "journey: a protocol-relative URL is dropped",
  );
  writePendingJourney(journey("https://evil.example"));
  check(
    readPendingJourney()?.returnTo === undefined,
    "journey: an absolute URL is dropped",
  );
  writePendingJourney(journey());
  check(
    readPendingJourney()?.returnTo === undefined,
    "journey: none started from Import",
  );
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
