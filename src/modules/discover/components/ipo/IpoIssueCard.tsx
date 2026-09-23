"use client";

import { CalendarDays, ChevronRight, HelpCircle, Info } from "lucide-react";
import type { IpoApplication, IpoIssue, IpoPriceBand } from "../../api/ipo";
import { formatIndianInt, formatInr } from "../../utils/inr";
import {
  type IpoWindowState,
  windowCountdownAt,
  windowDatesLabel,
  windowStateAt,
} from "../../utils/ipo-window";
import {
  CardDivider,
  Caveat,
  ChipTone,
  Fact,
  StatusChip,
} from "../shared/FeedKit";

/**
 * One issue on the calendar, as a card — finsharpe-mobile's `IpoIssueCard`.
 *
 * Everything on it comes from the calendar alone. An issue whose analysis is
 * missing, still generating or refused renders identically to one whose
 * analysis is ready, so a thin card is never mistaken for "nothing to say".
 */

/** `₹78 – ₹82`, or the single price of a fixed-price issue. */
function bandLabel(band: IpoPriceBand): string {
  const { minInr: low, maxInr: high } = band;
  if (low == null && high == null) return "—";
  if (low == null || high == null) return formatInr((low ?? high)!);
  if (band.isFixedPrice || low === high) return formatInr(low);
  return `${formatInr(low)} – ${formatInr(high)}`;
}

/**
 * "2 lots · 3,200 shares" under the rupee figure. The lot count is dropped
 * where the vendor's minimum bid is not a whole multiple of the lot: the
 * backend floors it there, and a floored count printed beside an exact share
 * count is the one place this card could quietly disagree with itself.
 */
function minApplicationSub(application: IpoApplication): string | null {
  const { minShares: shares, minLots: lots } = application;
  if (shares == null) return null;
  const sharesLabel = `${formatIndianInt(shares)} shares`;
  if (application.minSharesNotWholeLots || lots == null || lots < 1)
    return sharesLabel;
  return `${lots === 1 ? "1 lot" : `${lots} lots`}  ·  ${sharesLabel}`;
}

/**
 * The window state as a pill. The wording is deliberately distinct from the
 * section headings the calendar groups by, so a heading and a row's own badge
 * are never the same string.
 */
const WINDOW_CHIPS: Record<IpoWindowState, { label: string; tone: ChipTone }> =
  {
    open: { label: "Open", tone: "positive" },
    upcoming: { label: "Upcoming", tone: "info" },
    closed: { label: "Closed", tone: "neutral" },
    unknown: { label: "Dates unconfirmed", tone: "neutral" },
  };

/** `LUMINO · BSE, NSE` — the symbol a reader will search their broker for. */
const identityLine = (issue: IpoIssue) =>
  [issue.symbol, issue.exchanges.join(", ")].filter(Boolean).join("  ·  ");

export function IpoIssueCard({
  issue,
  now,
  identifiersUnavailable = false,
  onOpen,
}: {
  issue: IpoIssue;
  /** One clock for the whole list, so every countdown on screen agrees. */
  now: Date;
  /** Radar's listing could not be read for the whole calendar. */
  identifiersUnavailable?: boolean;
  onOpen: (fincode: number) => void;
}) {
  const { fincode } = issue.identifiers;
  const state = windowStateAt(issue.biddingWindow, now);
  const chip = WINDOW_CHIPS[state];
  // `windowDatesLabel` and the countdown both come back null on a window the
  // feed could not date at all, and the join then leaves an orphaned calendar
  // icon over nothing. Such a row says so in words instead — worded apart from
  // both the chip ("Dates unconfirmed") and the group heading ("Dates to be
  // confirmed"), so three different strings never read as three claims.
  const dates =
    [
      windowDatesLabel(issue.biddingWindow),
      windowCountdownAt(issue.biddingWindow, now),
    ]
      .filter(Boolean)
      .join("  ·  ") || "Dates to be announced";

  const body = (
    <>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-geist line-clamp-2 text-[13px] leading-snug font-medium text-[#0A1F4D]">
            {issue.issuer}
          </h4>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            {identityLine(issue)}
          </p>
        </div>
        <StatusChip
          label={chip.label}
          tone={chip.tone}
          dot={state === "open"}
        />
      </div>

      <CardDivider />

      <div className="space-y-2">
        <Fact
          label="Price band"
          value={bandLabel(issue.priceBand)}
        />
        <Fact
          label="Lot size"
          value={
            issue.application.lotSizeShares == null
              ? "—"
              : `${formatIndianInt(issue.application.lotSizeShares)} shares`
          }
        />
        {/* `minApplicationInr`, never `lotValueInr`: a BSE-SME issue's minimum
            bid is two lots, so one lot's cost is half what applying costs. */}
        <Fact
          label="Minimum application"
          value={
            issue.application.minApplicationInr == null
              ? "—"
              : formatInr(issue.application.minApplicationInr)
          }
          sub={minApplicationSub(issue.application)}
          strong
        />
        {issue.priceBand.cutOffAssumed && (
          <Caveat icon={<Info size={12} />}>
            The vendor sent no cut-off price, so these rupee figures use the top
            of the band.
          </Caveat>
        )}
      </div>

      <CardDivider />

      <div className="flex items-center gap-1.5">
        <CalendarDays
          size={13}
          className="shrink-0 text-slate-400"
        />
        <span className="min-w-0 flex-1 truncate text-[11px] text-slate-500">
          {dates}
        </span>
        {fincode != null && (
          <ChevronRight
            size={13}
            className="shrink-0 text-slate-300"
          />
        )}
      </div>

      {/* Two different claims, and the card knows which one it is making:
          `identifiersUnavailable` is Radar failing to answer, not Radar
          answering that it has never heard of this issuer. */}
      {fincode == null && (
        <div className="mt-2">
          <Caveat icon={<HelpCircle size={12} />}>
            {identifiersUnavailable
              ? "Analysis unavailable while the issuer lookup is down."
              : "This issuer is not in our research universe, so there is no analysis to open for it."}
          </Caveat>
        </div>
      )}
    </>
  );

  // A row with no fincode has nowhere to lead: the insight endpoint has no
  // other address for this issuer. Left un-inked rather than given a tap that
  // opens a page which cannot be filled.
  if (fincode == null) {
    return <div className="glass-card rounded-card p-4.5">{body}</div>;
  }

  return (
    <button
      onClick={() => onOpen(fincode)}
      className="glass-card rounded-card hover-tint block w-full p-4.5 text-left transition-colors"
    >
      {body}
    </button>
  );
}
