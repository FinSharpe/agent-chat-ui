import { getPortfolioConnect, portfolioConnectKey } from "./parse";

interface TurnMessage {
  type: string;
}

/**
 * The tool messages that draw a connect card: the first of each distinct
 * block within a turn (a human message starts the next one).
 *
 * "Analyse my ETFs" calls both portfolio tools, and each answers the missing
 * consent with its own block — one invitation, said twice (finsharpe-mobile
 * device pass, 2026-09-18). Two *different* absences keep a card each.
 */
export function connectCardMessages<M extends TurnMessage>(
  messages: readonly M[],
): Set<M> {
  const drawn = new Set<M>();
  let seen = new Set<string>();
  for (const message of messages) {
    if (message.type === "human") {
      seen = new Set();
      continue;
    }
    if (message.type !== "tool") continue;
    const connect = getPortfolioConnect(message);
    if (!connect) continue;
    const key = portfolioConnectKey(connect);
    if (seen.has(key)) continue;
    seen.add(key);
    drawn.add(message);
  }
  return drawn;
}
