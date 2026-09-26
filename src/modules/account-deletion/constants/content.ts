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
 * How long server backups holding a deleted account survive: RDS automated
 * backups keep 1 day (read 2026-09-17), so the snapshot taken before a
 * deletion can outlive it by up to about 2 days. Re-check if a manual
 * snapshot or an AWS Backup plan is ever added.
 */
export const BACKUP_ROLLOVER_PERIOD: string | null = "2 days";

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
    data: "Chat conversations, including any portfolio holdings saved with them",
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
      "We keep no separate copy on our servers. Holdings saved with a chat go with the chat. The copy in the app on your phone is removed when the app deletes your account. A copy that an earlier version of the web app saved in a browser is removed when you delete your account there. Another browser removes its copy the first time the web app opens there after that browser's sign-in has expired, which is at most 7 days after you last used the web app there; you can also clear this site's data in that browser",
  },
  {
    data: "Notification registrations",
    outcome: "Deleted",
  },
  {
    data: "Reports you ran, and their share links",
    outcome: "Removed from your account; share links stop working",
  },
  {
    data: "Access you gave other AI apps to your FinSharpe account, if any",
    outcome:
      "Revoked and deleted. An app that was already connected loses access within an hour",
  },
];

/**
 * What outlives a deleted account, as `services/account_deletion.py` in
 * finsharpe-agents leaves it (checked at 2aac9e8, 2026-09-25), plus the
 * copies our providers keep (LangSmith traces; OpenAI's abuse-monitoring
 * logs for the data tools' search embeddings). No SEBI record is kept: the
 * backend deletes consent records and keeps no advice record (owner,
 * 2026-09-17; counsel to confirm).
 */
export const KEPT_RECORDS = [
  "Records of data-tool calls: the inputs sent to our data tools, which can include holdings. Calls made while answering your chats never carried your account ID. Calls made by other AI apps you connected did, and we remove your account ID from them. We keep both, with the usage totals for those apps.",
  "Your credit history: the record of what your chat turns and reports cost in credits, and of the credits we added to your account. We remove your account ID from it and keep it, as our record of what answering you cost us.",
  "AI monitoring records of how your chat answers were produced (LangSmith), which can include your messages and any holdings fetched for them, until they expire, within 180 days.",
  "Search text our data tools sent to OpenAI to search filings and data sources, which OpenAI may keep for up to 30 days. It is not linked to your account.",
  "Server logs, which can contain your user ID and IP address, for no more than 90 days.",
];

/**
 * True while every chat model call is routed on zero-data-retention
 * endpoints and the OpenRouter account keeps no logs. The data tools'
 * search embeddings bypass OpenRouter; KEPT_RECORDS names them.
 */
export const AI_PROVIDERS_NOTE =
  "Our AI routing provider (OpenRouter) and the services that run the AI models for chat keep no copy of your chats, so there is nothing of yours to delete there.";
