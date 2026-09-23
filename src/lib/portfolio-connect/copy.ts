import { portfolioConnectNames, type PortfolioConnect } from "./parse";

/**
 * The connect card's words, per reason. Copy is finsharpe-mobile's
 * `PortfolioConnectCard` (#189, signed off 2026-09-18) word for word, so the
 * two apps say the same thing about the same absence; change them together.
 *
 * Every class name is printed from the block's own labels — the app keeps no
 * class vocabulary of its own for this, so a class a later server adds is
 * still named correctly.
 */

/**
 * A class label as it reads *inside* a sentence: "Mutual funds" becomes
 * "mutual funds", while "ETFs" and "SIPs" keep their capitals. A casing rule
 * over whatever labels arrive, not a map of known classes — a plain
 * `toLowerCase()` would print "etfs".
 */
export function inSentence(label: string): string {
  return /[A-Z]{2}/.test(label) ? label : label.toLowerCase();
}

/** "a", "a and b", "a, b and c". */
export function joinWords(words: string[]): string {
  if (words.length < 2) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

export interface PortfolioConnectCopy {
  title: string;
  body: string;
  cta: string;
  /** Shown only when the block names more than one class, so the reader sees
   *  what "your accounts" covers; one class is already in the title. */
  chips: string[];
}

const GENERIC_TITLE = "Connect your accounts to ask about your portfolio";

export function portfolioConnectCopy(
  connect: PortfolioConnect,
): PortfolioConnectCopy {
  const names = portfolioConnectNames(connect);
  const chips = names.length > 1 ? names : [];

  switch (connect.reason) {
    case "not_signed_in":
      return {
        title: "Sign in to ask about your portfolio",
        body: "Your connections live with your account. Sign in, then connect through OneMoney — we will bring you right back to this thread.",
        cta: "Sign in",
        chips,
      };
    case "no_consents":
      return {
        title: GENERIC_TITLE,
        body: "Each is a separate consent you approve on OneMoney, the RBI-licensed Account Aggregator. Read-only, and we never see your credentials.",
        cta: "Connect via OneMoney",
        chips,
      };
    case "class_not_connected":
      return {
        title:
          names.length === 0
            ? GENERIC_TITLE
            : `Connect your ${joinWords(names.map(inSentence))} to ask about them`,
        body: "OneMoney is an RBI-licensed Account Aggregator. FinSharpe gets read-only data and never sees your credentials.",
        cta: "Connect via OneMoney",
        chips,
      };
  }
}
