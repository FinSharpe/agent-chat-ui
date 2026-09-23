/**
 * Reading the connect prompt off a portfolio tool message.
 *
 * `get_user_portfolio` and `analyze_user_portfolio` (finsharpe-agents#215,
 * ADR-0014) answer "there is nothing to read" — a guest, no consents, or a
 * class the user has not linked — with `{"error": "no_portfolio", …}` for the
 * model and, for the app, `additional_kwargs.portfolio_connect`:
 *
 *   { reason: "not_signed_in" | "no_consents" | "class_not_connected",
 *     asset_classes: ["MUTUAL_FUNDS"], labels: ["Mutual funds"] }
 *
 * Same carrier and same shape of read as `getMcpAppPayload` and
 * `getCitationsPayload`. The block is a contract with finsharpe-mobile
 * (`PortfolioConnect` in `lib/features/chat/data/messages.dart`); change the
 * two together.
 *
 * Fails soft: an unknown reason is treated as no block at all, so a reason a
 * later server adds draws nothing rather than a card that invites the wrong
 * action.
 */

/** Key under `additional_kwargs` the agents' `user_portfolio_carrier` writes. */
const CONNECT_KEY = "portfolio_connect";

export const PORTFOLIO_CONNECT_REASONS = [
  "not_signed_in",
  "no_consents",
  "class_not_connected",
] as const;

export type PortfolioConnectReason = (typeof PORTFOLIO_CONNECT_REASONS)[number];

export interface PortfolioConnect {
  reason: PortfolioConnectReason;
  /** Consent enum values: `EQUITIES | MUTUAL_FUNDS | ETF | BANK_ACCOUNTS | SIP`. */
  assetClasses: string[];
  /** What to call them on screen, in `assetClasses` order — the server's names. */
  labels: string[];
}

function isReason(value: unknown): value is PortfolioConnectReason {
  return (
    typeof value === "string" &&
    (PORTFOLIO_CONNECT_REASONS as readonly string[]).includes(value)
  );
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is string => typeof entry === "string" && entry.length > 0,
  );
}

/** Parse one block, or null when it is not a usable connect prompt. */
export function parsePortfolioConnect(raw: unknown): PortfolioConnect | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const block = raw as Record<string, unknown>;
  if (!isReason(block.reason)) return null;
  return {
    reason: block.reason,
    assetClasses: strings(block.asset_classes),
    labels: strings(block.labels),
  };
}

/** The connect prompt a tool message carries, or null. */
export function getPortfolioConnect(message: unknown): PortfolioConnect | null {
  if (!message || typeof message !== "object") return null;
  const kwargs = (message as { additional_kwargs?: unknown }).additional_kwargs;
  if (!kwargs || typeof kwargs !== "object") return null;
  return parsePortfolioConnect(
    (kwargs as Record<string, unknown>)[CONNECT_KEY],
  );
}

/**
 * What makes two blocks the same invitation. "Analyse my ETFs" calls both
 * portfolio tools and each answers the absence with its own block; two
 * identical cards in one answer read as a stutter, not two things to do.
 */
export function portfolioConnectKey(connect: PortfolioConnect): string {
  return `${connect.reason}|${connect.assetClasses.join(",")}`;
}

/**
 * The names the card prints. The wire values stand in only when the block
 * arrived without labels — a contract slip the card survives by naming
 * something rather than nothing.
 */
export function portfolioConnectNames(connect: PortfolioConnect): string[] {
  return connect.labels.length > 0 ? connect.labels : connect.assetClasses;
}
