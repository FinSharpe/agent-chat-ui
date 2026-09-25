/**
 * The Credit Request: the user's one way to ask for credits — an email to
 * support composed here and opened in their mail app (#223 §5). There is no
 * server endpoint and no threshold for offering it; nothing is sold through
 * it. It is offered on the Credits page at any Balance, and beside a refused
 * chat turn (#282), and nowhere else.
 *
 * The body names the account, the Balance and the app, so the administrator
 * who reads the mailbox needs no lookup:
 *
 *   Hi FinSharpe,
 *
 *   Please add credits to my account.
 *
 *   Account: ada@example.com
 *   Balance: −13.10 credits
 *   App: Web
 *
 * A line whose value is not known yet (the email before `/auth/me` answers,
 * a Balance that failed to load) is left out rather than filled with a guess.
 */

import { SUPPORT_EMAIL } from "@/modules/account-deletion/constants/content";

import { CREDIT_REQUEST_APP, CREDIT_REQUEST_SUBJECT } from "../constants/copy";
import { balanceLabel } from "./format";

export interface CreditRequestInput {
  email: string | null | undefined;
  balanceMinor: number | null | undefined;
}

export function creditRequestBody({
  email,
  balanceMinor,
}: CreditRequestInput): string {
  const facts = [
    email ? `Account: ${email}` : null,
    typeof balanceMinor === "number"
      ? `Balance: ${balanceLabel(balanceMinor)}`
      : null,
    `App: ${CREDIT_REQUEST_APP}`,
  ].filter((line): line is string => line !== null);
  return [
    "Hi FinSharpe,",
    "",
    "Please add credits to my account.",
    "",
    ...facts,
  ].join("\n");
}

/** The `mailto:` the Request credits button opens. */
export function creditRequestHref(input: CreditRequestInput): string {
  const subject = encodeURIComponent(CREDIT_REQUEST_SUBJECT);
  const body = encodeURIComponent(creditRequestBody(input));
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}
