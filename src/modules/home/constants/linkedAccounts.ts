import { ConsentType } from "@/lib/moneyone/moneyone.enums";

/** The five account types Import can link, in the order Home lists them. */
export const LINKABLE_ACCOUNTS: ConsentType[] = [
  ConsentType.EQUITIES,
  ConsentType.MUTUAL_FUNDS,
  ConsentType.ETF,
  ConsentType.BANK_ACCOUNTS,
  ConsentType.SIP,
];

/** `name` reads inside a sentence ("Demat & mutual funds linked"); `short`
 *  fits the "Link …" call to action. */
export const ACCOUNT_LABELS: Record<ConsentType, { name: string; short: string }> = {
  [ConsentType.EQUITIES]: { name: "Demat", short: "Demat" },
  [ConsentType.MUTUAL_FUNDS]: { name: "mutual funds", short: "Funds" },
  [ConsentType.ETF]: { name: "ETFs", short: "ETFs" },
  [ConsentType.BANK_ACCOUNTS]: { name: "bank accounts", short: "Bank" },
  [ConsentType.SIP]: { name: "SIPs", short: "SIPs" },
};

/** Which missing account the "Link …" action offers first — bank first, as
 *  the reference design does. */
export const LINK_PRIORITY: ConsentType[] = [
  ConsentType.BANK_ACCOUNTS,
  ConsentType.EQUITIES,
  ConsentType.MUTUAL_FUNDS,
  ConsentType.ETF,
  ConsentType.SIP,
];

/** Seed for the Portfolio Health card: the app has no stored health score,
 *  so the card asks the agent for one instead of showing a number. */
export const HEALTH_CHECK_PROMPT =
  "Run a health check on my linked portfolio — concentration, fund overlap and quality.";
