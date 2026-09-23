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
  holdingsAnalysisMessage,
  SIP_ANALYSIS_MESSAGE,
} from "@/modules/import-data/utils/chat-handoffs";

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

if (failures > 0) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
