/**
 * Smart Alerts grouped by asset class (#86, the web port of finsharpe-mobile
 * #173): the served investment alerts (`POST /api/nudges/alerts`) and the SIP
 * alerts worked out in the browser, met at one shape so the card draws one
 * kind of block — title, `verdict · meta`, the line, `Ask AI →`.
 *
 * Mirrors finsharpe-mobile `smart_alerts.dart` and `local_alerts.dart`;
 * change the two apps together. Kept free of React so `pnpm check` can run it.
 */
import type { SmartAlert as ServedAlert } from "@/api/generated/nudge-apis/models";
import type { ActiveSip } from "../types/aa";

/** The classes Smart Alerts groups by, in the order the card draws them.
 *  Bank accounts are not one: the owner dropped them on the 2026-09-24
 *  device pass. */
export const ALERT_CLASSES = [
  "EQUITIES",
  "MUTUAL_FUNDS",
  "ETF",
  "SIP",
] as const;
export type AlertClass = (typeof ALERT_CLASSES)[number];

export type AlertTone = "positive" | "neutral" | "negative";

export interface SmartAlertItem {
  assetClass: AlertClass;
  /** What raised it (`score`, `category_rank`, `sip_missed`, …). The card
   *  never branches on it; it tells two alerts on one holding apart. */
  kind: string;
  title: string;
  badge?: { label: string; tone: AlertTone } | null;
  meta?: string | null;
  /** Its ₹ and % figures render in bold. */
  line?: string | null;
  /** What `Ask AI` sends to a new chat, as is. */
  question: string;
}

export interface SmartAlertGroup {
  assetClass: AlertClass;
  /** Empty: the class's all-clear line. */
  alerts: SmartAlertItem[];
}

/** At most this many alerts per class — the owner's five (mobile #201). */
export const SMART_ALERTS_PER_CLASS = 5;

export const ALERT_CLASS_LABELS: Record<AlertClass, string> = {
  EQUITIES: "Equities",
  MUTUAL_FUNDS: "Mutual funds",
  ETF: "ETFs",
  SIP: "SIPs",
};

const IN_SENTENCE: Record<AlertClass, string> = {
  EQUITIES: "equities",
  MUTUAL_FUNDS: "mutual funds",
  ETF: "ETFs",
  SIP: "SIPs",
};

/** "Nothing to flag in your ETFs today." */
export const allClearLine = (type: AlertClass) =>
  `Nothing to flag in your ${IN_SENTENCE[type]} today.`;

/** `Strong · Score 78 / 100` — the verdict, then the figure, whichever are
 *  present. */
export const metaLine = (a: Pick<SmartAlertItem, "badge" | "meta">) =>
  [a.badge?.label?.trim() ?? "", a.meta?.trim() ?? ""]
    .filter(Boolean)
    .join(" · ");

const sentence = (s: string) => {
  const t = s.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
};

/** The Ask AI message for a served alert that came without one. */
export function alertFallbackMessage(
  title: string,
  verdict?: string | null,
  line?: string | null,
) {
  const parts = [verdict?.trim(), line?.trim()].filter(Boolean);
  const lead = `Explain this alert on ${title}`;
  const question = "What does it mean for my portfolio?";
  return parts.length === 0
    ? `${lead}. ${question}`
    : `${lead}: ${sentence(parts.join(" — "))} ${question}`;
}

/** The served alert, or null for a class this build doesn't know — a future
 *  class renders nothing rather than breaking the card. */
export function fromServed(alert: ServedAlert): SmartAlertItem | null {
  const assetClass = alert.assetClass as string;
  if (!(ALERT_CLASSES as readonly string[]).includes(assetClass)) return null;
  if (assetClass === "SIP") return null;
  const h = alert.holding;
  const title = (alert.title || h?.name || h?.symbol || h?.isin || "").trim();
  if (!title) return null;
  const badge = alert.badge?.label
    ? {
        label: alert.badge.label,
        tone: (alert.badge.tone ?? "neutral") as AlertTone,
      }
    : null;
  const question = alert.question?.trim();
  return {
    assetClass: assetClass as AlertClass,
    kind: alert.kind ?? "",
    title,
    badge,
    meta: alert.meta ?? null,
    line: alert.line ?? null,
    question: question || alertFallbackMessage(title, badge?.label, alert.line),
  };
}

/**
 * One group per class in `held`, in card order, each keeping its alerts'
 * incoming order (the server ranks within a class), capped at five.
 *
 * A held class with no alert still gets a group — the all-clear line — but
 * only when `checked` says its alerts were actually worked out. A class whose
 * feed failed is left out rather than reported clear.
 */
export function groupSmartAlerts({
  held,
  alerts,
  checked,
}: {
  held: Iterable<AlertClass>;
  alerts: SmartAlertItem[];
  checked: (type: AlertClass) => boolean;
}): SmartAlertGroup[] {
  const heldSet = new Set(held);
  return ALERT_CLASSES.filter((type) => heldSet.has(type))
    .map((type) => ({
      assetClass: type,
      alerts: alerts
        .filter((a) => a.assetClass === type)
        .slice(0, SMART_ALERTS_PER_CLASS),
    }))
    .filter((g) => g.alerts.length > 0 || checked(g.assetClass));
}

/* --------------------------------- SIPs --------------------------------- */

/** Missed installment: the statement runs this many days past the expected
 *  debit without one. Mandates land a few days late around holidays. */
export const SIP_MISSED_GRACE_DAYS = 5;

/** Upcoming debit: expected within this many days from today. */
export const SIP_UPCOMING_DAYS = 7;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_MS = 86_400_000;

/** A calendar day in local time, from an ISO date or timestamp — never the
 *  UTC midnight `new Date("2026-09-07")` gives, which lands on the 6th west
 *  of Greenwich. */
function parseDay(input: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input ?? "");
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

const dayOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const daysBetween = (from: Date, to: Date) =>
  Math.round((to.getTime() - from.getTime()) / DAY_MS);
const dayMonth = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

/** `4999.75` → `₹4,999.75`; `5000` → `₹5,000`. An observed installment is
 *  shown exactly as the registrar reported it, never grossed up. */
export function formatInrExact(value: number): string {
  const whole = Math.round(value);
  const sign = value < 0 ? "-" : "";
  if (Math.abs(value - whole) < 0.005) {
    return `${sign}₹${Math.abs(whole).toLocaleString("en-IN")}`;
  }
  return `${sign}₹${Math.abs(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Missed installments first, then upcoming debits, each soonest first.
 *
 * "Missed" is judged against `transactionsEnd` — the last day the shared
 * statement covers — never against today: a statement fetched a month ago has
 * not missed anything, it simply stops before the debit. "Upcoming" needs the
 * expected date after that statement and within seven days of `today`.
 *
 * Monthly SIPs only: only they carry a next-debit estimate. The figures stay
 * in the browser until the user clicks Ask AI.
 */
export function sipAlerts(
  sips: ActiveSip[],
  { transactionsEnd, today }: { transactionsEnd?: string | null; today: Date },
): SmartAlertItem[] {
  const end = parseDay(transactionsEnd);
  const day = dayOf(today);
  const missed: [Date, SmartAlertItem][] = [];
  const upcoming: [Date, SmartAlertItem][] = [];

  for (const sip of sips) {
    if (
      sip.cadence?.toLowerCase() !== "monthly" ||
      !(sip.installmentAmount > 0)
    ) {
      continue;
    }
    const due = parseDay(sip.nextDebitEstimate);
    if (!due) continue;
    const name = sip.schemeName?.trim() || sip.isin;
    const amount = formatInrExact(sip.installmentAmount);

    if (end && end >= addDays(due, SIP_MISSED_GRACE_DAYS)) {
      const month = MONTH_NAMES[due.getMonth()];
      const last = parseDay(sip.lastDebitDate);
      missed.push([
        due,
        {
          assetClass: "SIP",
          kind: "sip_missed",
          title: name,
          badge: { label: "Missed", tone: "negative" },
          meta: `${month} installment`,
          line: `No ${month} installment of ${amount} seen.${last ? ` The last one debited on ${dayMonth(last)}.` : ""}`,
          question: `My ${amount} ${month} SIP installment for ${name} doesn't show up in my statement.${last ? ` The last one was on ${dayMonth(last)}.` : ""} What could have happened, and what should I check?`,
        },
      ]);
      continue;
    }

    const inStatement = !!end && end >= due;
    const days = daysBetween(day, due);
    if (!inStatement && days >= 0 && days <= SIP_UPCOMING_DAYS) {
      const when =
        days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
      upcoming.push([
        due,
        {
          assetClass: "SIP",
          kind: "sip_upcoming",
          title: name,
          badge: { label: "Upcoming", tone: "neutral" },
          meta: dayMonth(due),
          line: `${amount} is expected to debit around ${dayMonth(due)}, ${when}.`,
          question: `My ${amount} SIP in ${name} is due around ${dayMonth(due)}. Anything I should know before it debits?`,
        },
      ]);
    }
  }

  const soonest = (a: [Date, SmartAlertItem], b: [Date, SmartAlertItem]) =>
    a[0].getTime() - b[0].getTime();
  return [
    ...missed.sort(soonest).map(([, a]) => a),
    ...upcoming.sort(soonest).map(([, a]) => a),
  ];
}

/** Splits a line into plain and figure runs — ₹ amounts and percentages —
 *  so the card can bold the figures (the reference's `renderEmphasized`). */
export function emphasisRuns(
  text: string,
): { text: string; strong: boolean }[] {
  return text
    .split(/(₹[\d,.]+[A-Za-z]*|\d+(?:\.\d+)?%)/g)
    .filter((part) => part !== "")
    .map((part) => ({
      text: part,
      strong: /^(₹[\d,.]|\d+(?:\.\d+)?%$)/.test(part),
    }));
}
