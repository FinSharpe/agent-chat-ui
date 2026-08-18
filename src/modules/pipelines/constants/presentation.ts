/**
 * Presentation rules shared across the pipelines surfaces: badge tones,
 * Stance tone, vintage stamp copy, and run/step status wording.
 *
 * The copy here is the web half of decisions settled in the `finsharpe-mobile`
 * Phase 5/6 previews — `report_presentation.dart` is the other half. Where a
 * string differs between the two surfaces it is because the surface differs,
 * never because one of them drifted.
 */

import { formatWireDate } from "./metric-dictionary";

/* -------------------------------------------------------------------------- */
/* Section Badges                                                             */
/* -------------------------------------------------------------------------- */

export interface Tone {
  /** Tailwind classes for a chip: background, ink, border. */
  chip: string;
  /** Ink only — for a dot, an icon, a headline. */
  ink: string;
  /** Solid fill — for the dot on the Stance header, which sits on navy. */
  dot: string;
}

const NEUTRAL_TONE: Tone = {
  chip: "bg-muted text-text-secondary border-border-default",
  ink: "text-text-secondary",
  dot: "bg-text-muted",
};

const TONES: Record<string, Tone> = {
  positive: {
    chip: "bg-success-bg text-success-fg border-success-border",
    ink: "text-success-fg",
    dot: "bg-success-fg",
  },
  caution: {
    chip: "bg-warning-bg text-warning-fg border-warning-border",
    ink: "text-warning-fg",
    dot: "bg-warning-fg",
  },
  neutral: NEUTRAL_TONE,
};

/** Badge value → chip tone. Unknown values read neutral, never crash. */
export function badgeTone(value: string | undefined): Tone {
  return (value && TONES[value]) || NEUTRAL_TONE;
}

/* -------------------------------------------------------------------------- */
/* Stance                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The Stance is a verdict, not a recommendation — it never becomes a green
 * "buy" or a red "sell". Constructive gets the brand teal, cautious the
 * warning amber, balanced stays neutral.
 */
const STANCE_TONES: Record<string, Tone> = {
  constructive: {
    chip: "bg-success-bg text-success-fg border-success-border",
    ink: "text-success-fg",
    dot: "bg-brand-teal",
  },
  cautious: {
    chip: "bg-warning-bg text-warning-fg border-warning-border",
    ink: "text-warning-fg",
    dot: "bg-warning-fg",
  },
  balanced: NEUTRAL_TONE,
};

export function stanceTone(value: string | undefined): Tone {
  return (value && STANCE_TONES[value]) || NEUTRAL_TONE;
}

/* -------------------------------------------------------------------------- */
/* Vintage                                                                    */
/* -------------------------------------------------------------------------- */

/** Human name for a vintage-probed source key. */
export function vintageSourceLabel(source: string): string {
  switch (source) {
    case "definedge_prices":
      return "Prices";
    case "finsharpe_scores":
      return "FinSharpe scores";
    case "filings":
      return "Filings";
    case "news":
      return "News";
    case "fno_positioning":
      return "F&O positioning";
    default:
      return source;
  }
}

/**
 * The per-source stamp copy the previews fixed: prices carry "close",
 * news/F&O carry "session", filings read "to `<date>`".
 */
export function vintageDetail(source: string, token: string): string {
  const date = formatWireDate(token);
  switch (source) {
    case "definedge_prices":
      return `${date} close`;
    case "news":
    case "fno_positioning":
      return `${date} session`;
    case "filings":
      return `to ${date}`;
    default:
      return date;
  }
}

/** The one-line stamp printed on a chart ("Prices · 12 Aug 2026 close"). */
export function vintageStampText(
  stamp: { source: string; token: string } | null | undefined,
): string {
  if (!stamp) return "Vintage unknown";
  const label =
    stamp.source === "finsharpe_scores"
      ? "Scores"
      : stamp.source === "fno_positioning"
        ? "F&O"
        : vintageSourceLabel(stamp.source);
  return `${label} · ${vintageDetail(stamp.source, stamp.token)}`;
}

/* -------------------------------------------------------------------------- */
/* Run + step status                                                          */
/* -------------------------------------------------------------------------- */

export const STEP_STATUS_LABEL: Record<string, string> = {
  pending: "Waiting",
  running: "Working",
  succeeded: "Done",
  failed: "Unavailable",
  coverage_gap: "Not covered",
  not_wired: "Not built",
};

export const RUN_STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  running: "Running",
  published: "Ready",
  failed: "Failed",
  cancelled: "Cancelled",
};

/**
 * Deliberately identical wording for a failed step and a coverage gap's
 * *tone* but not its meaning: both are disclosed, neither is hidden, and the
 * report keeps a visible placeholder for each. The distinction the copy has to
 * carry is "we could not" versus "there is nothing to".
 *
 * `not_wired` gets a third wording rather than borrowing either. A coverage
 * gap is a fact about the stock, disclosed on the quote before payment; an
 * unbuilt section is a fact about the report itself, and telling a reader
 * their stock was out of coverage when nobody had built the section yet
 * would simply be untrue.
 */
export const SECTION_ABSENCE_COPY: Record<
  string,
  { title: string; body: string }
> = {
  coverage_gap: {
    title: "Not covered for this stock",
    body: "This section was declared out of coverage before you paid, so it was never run.",
  },
  failed: {
    title: "Could not be produced",
    body: "This section's data could not be fetched for this run. Nothing here was estimated or filled in.",
  },
  not_wired: {
    title: "Not built yet",
    body: "This section is part of this report and has not been built yet, so it did not run. Nothing about this stock was out of reach.",
  },
};

/**
 * Formats an ISO timestamp as "12 Aug 2026, 14:32 IST".
 *
 * Pinned to IST rather than the reader's locale, for two reasons: the market
 * these reports are about runs on it, and a locale-dependent string renders
 * differently on the server and in the browser, which is a hydration mismatch
 * on every page that shows a publish time.
 */
export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  })} IST`;
}

/** "50 credits" / "1 credit" — the price never renders as a currency. */
export function creditsLabel(count: number): string {
  return `${count} ${count === 1 ? "credit" : "credits"}`;
}
