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

/** What a Technical or Fundamental card carries into its `Ask AI`. */
export interface SignalCardFacts {
  /** The holding as the card names it: symbol, else name, else ISIN. */
  symbol: string;
  /** The served verdict badge's label, when the feed graded the holding. */
  badge?: string | null;
  /** The served one-line reading. */
  line?: string | null;
}

/**
 * How a Deep Dive card names its holding — `holding.symbol ?? name ?? isin`,
 * as mobile's `NudgeCard.fromJson` does. A fund card's "symbol" is the scheme
 * name the feed echoed, which the portfolio tool matches as a name fragment.
 */
export const signalSymbol = (h: {
  symbol?: string | null;
  name?: string | null;
  isin?: string | null;
}) => h.symbol ?? h.name ?? h.isin ?? "-";

/** A served line that does not end in a full stop would run into the question. */
const sentence = (s: string) => {
  const trimmed = s.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

/**
 * `{verdict} — {line}` from what the card really carries, either or both.
 * Nothing is invented: an ungraded card gets no verdict, one with no line
 * gets no line.
 */
function signalClause(card: SignalCardFacts): string | null {
  const parts = [card.badge?.trim() ?? "", card.line?.trim() ?? ""].filter(
    (p) => p !== "",
  );
  return parts.length === 0 ? null : sentence(parts.join(" — "));
}

function signalMessage(kind: string, card: SignalCardFacts, question: string) {
  const lead = `Explain this ${kind} on ${card.symbol}`;
  const clause = signalClause(card);
  return clause == null
    ? `${lead}. ${question}`
    : `${lead}: ${clause} ${question}`;
}

/**
 * The Technical row's `Ask AI`: the symbol, the served verdict and line, then
 * the question — naming the holding again so the agent looks that position
 * up with `get_user_portfolio(symbols: [...])`. No figures of its own; pasted
 * numbers would disagree with the tool as soon as either side refreshed.
 *
 *     Explain this technical signal on TCS: Bullish — Golden Cross formed,
 *     RSI at 62. What does it mean for my TCS position, and what should I
 *     watch next?
 */
export const technicalSignalMessage = (card: SignalCardFacts) =>
  signalMessage(
    "technical signal",
    card,
    `What does it mean for my ${card.symbol} position, and what should I watch next?`,
  );

/** The Fundamental row's `Ask AI`, on the same anatomy with the peer question. */
export const fundamentalSignalMessage = (card: SignalCardFacts) =>
  signalMessage(
    "fundamental signal",
    card,
    `How does it compare with peers, and what does it mean for my ${card.symbol} holding?`,
  );
