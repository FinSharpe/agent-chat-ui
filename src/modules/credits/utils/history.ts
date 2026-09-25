/**
 * One History entry as a row: title, the line under it, the signed amount and
 * where a tap goes. Pure, so the row rules are checked without a browser
 * (`pnpm check:credits`).
 *
 * The rules (#223 §4, #231 decision 2–3, #279):
 * - A **turn** is titled from this browser's thread list, "Chat" when the
 *   thread is not in it; a tap opens the thread, and a row with no thread to
 *   open opens nothing. An open turn "may adjust until <closes_at>"; a turn
 *   that did not end normally says so ("stopped", "timed out", "ended with an
 *   error"); waived and refunded turns are named as such.
 * - A **purchase** carries the server's title (the Pipeline's name); a tap
 *   opens the report it bought, unless it was refunded — a refunded buyer
 *   cannot read that report any more.
 * - An **allotment** or a **refund** carries the server's title, from the
 *   reason vocabulary. Never an administrator's note: the wire has none.
 * - Charges read in ink, never rose (a Charge is the normal case);
 *   Allotments and Refunds in the positive green.
 * - No running Balance on any row (J8): the wire carries none.
 *
 * Times are shown in IST, as every other timestamp in this app is
 * (`formatTimestamp` in the pipelines module): the market these credits are
 * spent on runs on it.
 */

import type { UserCreditHistoryEntry } from "@/api/generated/credits-apis/models";

import {
  CHAT_FALLBACK_TITLE,
  KIND_FALLBACK_TITLE,
  REFUNDED_WORD,
  REPORT_WORD,
  TERMINAL_STATUS_WORDS,
  WAIVED_WORD,
  mayAdjustUntil,
} from "../constants/copy";
import { formatSignedCredits } from "./format";

export type HistoryTone = "ink" | "positive";

export type HistoryTarget =
  | { kind: "thread"; threadId: string }
  | { kind: "report"; runId: string }
  | null;

export interface HistoryRowView {
  key: string;
  title: string;
  /** "Today · 14:02 · stopped" */
  sub: string;
  /** "−0.42", "+20.00" */
  amount: string;
  tone: HistoryTone;
  target: HistoryTarget;
}

/* -------------------------------------------------------------------------- */
/* Dates, in IST                                                               */
/* -------------------------------------------------------------------------- */

const TIME_ZONE = "Asia/Kolkata";

const DAY_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const DAY_MONTH = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
});
const DAY_MONTH_YEAR = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Days since the epoch of the IST calendar date `date` falls on. */
function istDayNumber(date: Date): number {
  const parts = Object.fromEntries(
    DAY_PARTS.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return Math.round(
    Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) /
      86_400_000,
  );
}

function istYear(date: Date): string {
  return (
    DAY_PARTS.formatToParts(date).find((part) => part.type === "year")?.value ??
    ""
  );
}

/** "Today", "Yesterday", "Tomorrow", "19 September", "19 September 2025". */
export function dayLabel(date: Date, now: Date): string {
  const diff = istDayNumber(date) - istDayNumber(now);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return istYear(date) === istYear(now)
    ? DAY_MONTH.format(date)
    : DAY_MONTH_YEAR.format(date);
}

/** "14:02" */
export function timeLabel(date: Date): string {
  return TIME.format(date);
}

/** When an open turn stops adjusting: "14:30" today, "tomorrow 14:30". */
function untilLabel(date: Date, now: Date): string {
  const day = dayLabel(date, now);
  if (day === "Today") return timeLabel(date);
  const lead = day === "Tomorrow" ? "tomorrow" : day;
  return `${lead} ${timeLabel(date)}`;
}

function parse(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/* -------------------------------------------------------------------------- */
/* Rows                                                                        */
/* -------------------------------------------------------------------------- */

export interface HistoryRowContext {
  /** thread id → the title this browser's thread list shows for it. */
  threadTitles: ReadonlyMap<string, string>;
  now: Date;
  /** Position in the whole list; keeps two same-instant rows apart. */
  index: number;
}

function qualifiers(entry: UserCreditHistoryEntry, now: Date): string[] {
  const words: string[] = [];
  if (entry.kind === "turn") {
    const ended = entry.terminal_status
      ? TERMINAL_STATUS_WORDS[entry.terminal_status]
      : undefined;
    if (ended) words.push(ended);
    const closes = parse(entry.closes_at);
    if (entry.status === "open" && closes) {
      words.push(mayAdjustUntil(untilLabel(closes, now)));
    }
    if (entry.status === "waived") words.push(WAIVED_WORD);
  }
  if (entry.kind === "purchase") words.push(REPORT_WORD);
  if (
    entry.status === "refunded" &&
    (entry.kind === "turn" || entry.kind === "purchase")
  ) {
    words.push(REFUNDED_WORD);
  }
  return words;
}

function titleOf(
  entry: UserCreditHistoryEntry,
  threadTitles: ReadonlyMap<string, string>,
): string {
  if (entry.kind === "turn") {
    return (
      (entry.thread_id && threadTitles.get(entry.thread_id)) ||
      CHAT_FALLBACK_TITLE
    );
  }
  const title = entry.title?.trim();
  if (title) return title;
  return KIND_FALLBACK_TITLE[entry.kind] ?? CHAT_FALLBACK_TITLE;
}

function targetOf(
  entry: UserCreditHistoryEntry,
  threadTitles: ReadonlyMap<string, string>,
): HistoryTarget {
  if (entry.kind === "turn") {
    return entry.thread_id && threadTitles.has(entry.thread_id)
      ? { kind: "thread", threadId: entry.thread_id }
      : null;
  }
  if (
    entry.kind === "purchase" &&
    entry.run_id &&
    entry.status !== "refunded"
  ) {
    return { kind: "report", runId: entry.run_id };
  }
  return null;
}

export function historyRowView(
  entry: UserCreditHistoryEntry,
  { threadTitles, now, index }: HistoryRowContext,
): HistoryRowView {
  const at = parse(entry.occurred_at);
  const when = at ? [dayLabel(at, now), timeLabel(at)] : [];
  return {
    key: `${entry.kind}:${entry.turn_id ?? entry.purchase_id ?? ""}:${entry.occurred_at}:${index}`,
    title: titleOf(entry, threadTitles),
    sub: [...when, ...qualifiers(entry, now)].join(" · "),
    amount: formatSignedCredits(entry.amount_minor),
    tone:
      entry.kind === "allotment" || entry.kind === "refund"
        ? "positive"
        : "ink",
    target: targetOf(entry, threadTitles),
  };
}

/** Every loaded page, flattened in the order the server sent them. */
export function historyEntries(
  pages: readonly { entries: UserCreditHistoryEntry[] }[] | undefined,
): UserCreditHistoryEntry[] {
  return (pages ?? []).flatMap((page) => page.entries);
}

/* -------------------------------------------------------------------------- */
/* The state line                                                              */
/* -------------------------------------------------------------------------- */

/**
 * What the line under the Balance says: nothing at or above zero; "below
 * zero" when negative and nobody is refused; the Short Balance notice when
 * `gated` — the Admission verdict, which the figure alone cannot tell.
 */
export type CreditState = "none" | "below_zero" | "short_balance";

export function creditStateOf(credits: {
  balance_minor: number;
  gated: boolean;
}): CreditState {
  if (credits.gated) return "short_balance";
  if (credits.balance_minor < 0) return "below_zero";
  return "none";
}
