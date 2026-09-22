/**
 * The one line under an account row's label, and the small formatters it needs.
 *
 * Ported from finsharpe-mobile `portfolio_tab.dart` (`_trouble` ln 1503-1524,
 * `_caption` ln 1531-1569) and `portfolio_controller.dart` (`countCaption`).
 * Exactly one line shows, chosen by this priority: trouble phrase → unconnected
 * pitch → rupee value → count caption.
 */
import {
  CLASS_PITCHES,
  isConsentExpired,
  type ClassPosition,
  type ConsentTrouble,
} from "./aa-fold";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Indian digit grouping, no decimals — ₹13,43,248. */
export function formatInr(value: number): string {
  const rounded = Math.round(Math.abs(value));
  const grouped = rounded.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return `${value < 0 ? "-" : ""}₹${grouped}`;
}

/** Validity dates — "6 Jul 2027". */
export function shortDate(input: string | Date | null | undefined): string {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Last synced" — just now / 5 min ago / 3 h ago / 2 d ago / 6 Jul. */
export function relativeTime(input: string | Date | null | undefined): string {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";

  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d ago`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/** "24 stocks" / "8 folios" / "3 active · ₹15,000 monthly, not in net worth". */
export function countCaption(position: ClassPosition): string {
  const { type, count, monthlyCommitment } = position;
  switch (type) {
    case "EQUITIES":
      return plural(count, "stock", "stocks");
    case "MUTUAL_FUNDS":
      return plural(count, "folio", "folios");
    case "BANK_ACCOUNTS":
      return plural(count, "account", "accounts");
    case "SIP":
      return monthlyCommitment != null && monthlyCommitment > 0
        ? `${count} active · ${formatInr(monthlyCommitment)} monthly, not in net worth`
        : `${plural(count, "registration", "registrations")} · not in net worth`;
    default:
      return plural(count, "holding", "holdings");
  }
}

export type CaptionTone = "warning" | "negative" | "muted" | "value";

export interface RowCaption {
  text: string;
  tone: CaptionTone;
  /** The unconnected pitch may wrap once; every other caption is one line. */
  clamp: 1 | 2;
}

/**
 * The trouble phrase, or null when the row is healthy or unconnected.
 *
 * The "— tap to retry" / "— renew" suffixes are appended only when the row body
 * actually routes to the fix (i.e. no data on hand); with data the body opens
 * analysis and the hint would be a lie.
 */
export function troubleCaption(
  position: ClassPosition,
  trouble: ConsentTrouble,
): RowCaption | null {
  const { state, hasData, brokenConsent } = position;

  if (state === "unconnected" || state === "synced") return null;

  if (state === "syncing") {
    return { text: "Syncing…", tone: "warning", clamp: 1 };
  }

  if (state === "syncFailed") {
    return {
      text: hasData ? "Couldn’t sync" : "Couldn’t sync — tap to retry",
      tone: "negative",
      clamp: 1,
    };
  }

  // expired
  if (!brokenConsent) {
    return { text: "Syncing…", tone: "warning", clamp: 1 };
  }

  const suffix = hasData ? "" : " — renew";
  const text = trouble.dead.has(brokenConsent.consentID)
    ? `Consent no longer active${suffix}`
    : `Consent expired ${shortDate(brokenConsent.consentExpiry)}${suffix}`;

  return { text, tone: "warning", clamp: 1 };
}

/** The whole ladder — first match wins, exactly one line. */
export function rowCaption(
  position: ClassPosition,
  trouble: ConsentTrouble,
): RowCaption | null {
  const troubled = troubleCaption(position, trouble);
  if (troubled) return troubled;

  if (position.state === "unconnected") {
    if (position.activeSips > 0) {
      return {
        text: `${position.activeSips} active SIP${position.activeSips === 1 ? "" : "s"} · not in net worth`,
        tone: "muted",
        clamp: 1,
      };
    }
    return { text: CLASS_PITCHES[position.type], tone: "muted", clamp: 2 };
  }

  if (position.value != null) {
    return { text: formatInr(position.value), tone: "value", clamp: 1 };
  }

  if (position.hasData) {
    return { text: countCaption(position), tone: "muted", clamp: 1 };
  }

  return null;
}

/** The manage sheet's status chip for one consent. */
export function consentStatusChip(
  consent: { consentID: string; consentExpiry: string },
  trouble: ConsentTrouble,
  hasBlob: boolean,
): { label: string; tone: "warning" | "positive" | "neutral" } {
  if (trouble.dead.has(consent.consentID) || isConsentExpired(consent as never)) {
    return { label: "Expired", tone: "warning" };
  }
  if (hasBlob) return { label: "Synced", tone: "positive" };
  if (trouble.failed.has(consent.consentID)) {
    return { label: "Not synced", tone: "warning" };
  }
  return { label: "Syncing", tone: "neutral" };
}
