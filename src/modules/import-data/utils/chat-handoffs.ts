/**
 * The user messages the Import page hands to chat.
 *
 * The investment hand-offs send the request, not the data (#85). The agent
 * reads the signed-in user's own holdings through `get_user_portfolio` and
 * `analyze_user_portfolio` (finsharpe-agents ADR-0014), so a big book no
 * longer becomes a message tens of thousands of characters long, and chat
 * never answers from a copy staler than the one the tool fetches. Each
 * sentence is the one the agent's playbook names for its hand-off
 * (`src/prompts/system_instructions.md`, "The user's own portfolio"), and the
 * answer's shape is the playbook's too, not a list in the prompt.
 *
 * The sentences match finsharpe-mobile's `chat_messages.dart` (#171) byte for
 * byte; change the two together. Bank accounts still go as figures
 * (`useImportBankAccountsMutation`) until finsharpe-agents#238.
 */
import { ConsentType } from "@/modules/import-data/types/consent-type";

/** The classes whose holdings the agent analyses. */
export const INVESTMENT_CLASSES = [
  ConsentType.EQUITIES,
  ConsentType.MUTUAL_FUNDS,
  ConsentType.ETF,
] as const;

export type InvestmentClass = (typeof INVESTMENT_CLASSES)[number];

/** A holdings preview's hand-off. Class names are the app's own: "equities". */
export function holdingsAnalysisMessage(type: InvestmentClass): string {
  switch (type) {
    case ConsentType.EQUITIES:
      return "Analyse my equities.";
    case ConsentType.MUTUAL_FUNDS:
      return "Analyse my mutual funds.";
    case ConsentType.ETF:
      return "Analyse my ETFs.";
  }
}

export function isInvestmentClass(type: string): type is InvestmentClass {
  return (INVESTMENT_CLASSES as readonly string[]).includes(type);
}

/** The SIPs preview's hand-off. */
export const SIP_ANALYSIS_MESSAGE = "Analyse my SIPs.";

/**
 * The comprehensive run's request, or null when no investment class holds
 * anything — the run then fails rather than asking the agent about a book the
 * page knows is empty.
 */
export function comprehensiveAnalysisMessage(
  positions: readonly { type: string; count: number }[],
): string | null {
  const hasHoldings = positions.some(
    (p) => isInvestmentClass(p.type) && p.count > 0,
  );
  return hasHoldings
    ? "Give me a comprehensive analysis of my portfolio."
    : null;
}
