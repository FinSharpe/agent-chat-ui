/**
 * Copy for the public `/delete-account` page — the URL Google Play's
 * Data-safety form links to (agent-chat-ui#73).
 *
 * Source: finsharpe-mobile `docs/legal/delete-account.md`. Change the two
 * together. Play checks that the page names the app and developer, gives the
 * deletion steps, and says what is deleted and what is kept for how long —
 * keep all four.
 */

export const DELETE_ACCOUNT_PATH = "/delete-account";

export const APP_NAME = "FinSharpe";
export const DEVELOPER_NAME = "FinSharpe Private Limited";

export const SUPPORT_EMAIL = "info@finsharpe.com";
export const DELETION_EMAIL_SUBJECT = "Delete my account";
export const EMAIL_DELETION_PERIOD = "7 days";

export const PRIVACY_URL = "https://finsharpe.com/privacy-policy";

export const GRIEVANCE_OFFICER = "Mr. Sabir Bakir Jana";
export const REGISTERED_ADDRESS =
  "506 Seasons Business Square, Aundh, Pune 411007";

/**
 * How long server backups holding a deleted account survive. Unset until the
 * owner reads the RDS backup retention setting; the sentence is left off the
 * page rather than published with a guess.
 */
export const BACKUP_ROLLOVER_PERIOD: string | null = null;

/**
 * The path as the app actually draws it (finsharpe-mobile#163, built
 * 2026-09-16): deletion sits one sheet below the account sheet, and the
 * confirmation is a two-second hold rather than a button. Play checks these
 * steps against the app, so they change with it.
 */
export const IN_APP_STEPS = [
  "Open the FinSharpe app and sign in.",
  "Tap your initials at the top right.",
  "Tap Signed in, at the top of the sheet.",
  "Tap Delete account, at the bottom.",
  "Press and hold Hold to delete account for 2 seconds.",
];

export interface DeletedDataRow {
  data: string;
  outcome: string;
}

export const DELETED_DATA: DeletedDataRow[] = [
  {
    data: "Your account: name, email, password hash, credit balance",
    outcome: "Deleted",
  },
  {
    data: "Sign-in sessions on every device",
    outcome: "Ended and deleted",
  },
  {
    data: "Chat conversations and their history",
    outcome: "Deleted",
  },
  {
    data: "Account Aggregator connections",
    outcome:
      "Each consent is revoked at MoneyOne, so no more data can be fetched, and our consent records are deleted",
  },
  {
    data: "Your financial data",
    outcome:
      "We never store it on our servers. The copy in the app on your phone is removed when the app deletes your account",
  },
  {
    data: "Notification registrations",
    outcome: "Deleted",
  },
  {
    data: "Reports you ran, and their share links",
    outcome: "Deleted; share links stop working",
  },
];

export const KEPT_RECORDS = [
  "Records we must keep as a SEBI-registered Investment Adviser (consent records and records of the advice given) — for the period the SEBI (Investment Advisers) Regulations, 2013 require, under that law.",
];
