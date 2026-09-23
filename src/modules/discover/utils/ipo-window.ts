/**
 * Where an IPO's bidding window stands, and how long is left — derived here,
 * in the browser, from the two instants the calendar returns. Ported from
 * finsharpe-mobile `lib/features/ipo/ipo_window.dart`.
 *
 * Three rules hold everything here:
 *
 * 1. **The window is read from `biddingWindow` and nothing else.** The feed's
 *    own `canApply` is true on issues that open days later — it means "the
 *    platform takes applications, pre-orders included", not "bidding is open".
 * 2. **IST is a fixed offset, not the browser's zone.** A window is an Indian
 *    market fact; a laptop in Dubai must not see it slide by ninety minutes.
 * 3. **`timesAssumed` caps the precision.** Where the vendor sent a date with
 *    no time, the backend used the day's start or end; an hours-and-minutes
 *    countdown against that would be a number this app invented.
 */

import type { IpoBiddingWindow } from "../api/ipo";
import { MONTHS_SHORT } from "./relative-time";

/** India Standard Time as a fixed offset. It has no DST, so this is the whole truth. */
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export type IpoWindowState = "open" | "upcoming" | "closed" | "unknown";

/** The IST calendar day an instant falls on, as a day number to subtract from another. */
const istDayIndex = (instant: Date) =>
  Math.floor((instant.getTime() + IST_OFFSET_MS) / 86400000);

/** Whole IST calendar days from `from` to `to`. Negative when `to` is behind. */
export const istDaysBetween = (from: Date, to: Date) =>
  istDayIndex(to) - istDayIndex(from);

/** "31 Aug", in IST. */
function istDayLabel(instant: Date | null): string | null {
  if (!instant) return null;
  const ist = new Date(instant.getTime() + IST_OFFSET_MS);
  return `${ist.getUTCDate()} ${MONTHS_SHORT[ist.getUTCMonth()]}`;
}

/**
 * Which state a window is in at `now`.
 *
 * "Open" is only ever claimed on an issue known to have opened: a window
 * missing its `opensAt` reads as unknown however inviting its close date
 * looks — "we do not know when this opens" and "you have missed it" are
 * different sentences to someone holding money.
 */
export function windowStateAt(
  window: IpoBiddingWindow,
  now: Date,
): IpoWindowState {
  const { opensAt, closesAt } = window;
  if (closesAt && now.getTime() >= closesAt.getTime()) return "closed";
  if (!opensAt) return "unknown";
  if (now.getTime() < opensAt.getTime()) return "upcoming";
  return "open";
}

/**
 * "Closes in 3 days" / "Opens tomorrow" / "Closes in 45 min", or null where
 * there is nothing left to count down to.
 *
 * Days are IST *calendar* days, not 24-hour blocks: an issue closing tomorrow
 * at 5pm says "tomorrow" at both 9am and 11pm today, which is how a deadline
 * is actually counted. Sub-day precision appears only inside the final hour,
 * and never when the times were assumed.
 */
export function windowCountdownAt(
  window: IpoBiddingWindow,
  now: Date,
): string | null {
  const state = windowStateAt(window, now);
  const target =
    state === "upcoming" ? window.opensAt : state === "open" ? window.closesAt : null;
  const verb = state === "upcoming" ? "Opens" : "Closes";
  if (!target) return null;

  const days = istDaysBetween(now, target);
  if (days >= 2) return `${verb} in ${days} days`;
  if (days === 1) return `${verb} tomorrow`;

  // Same IST day. An assumed time makes the hour fiction, so the day is as
  // fine as this goes.
  if (window.timesAssumed) return `${verb} today`;
  const minutes = Math.floor((target.getTime() - now.getTime()) / 60000);
  if (minutes < 60) {
    return minutes <= 1 ? `${verb} in under a minute` : `${verb} in ${minutes} min`;
  }
  return `${verb} today`;
}

/**
 * "27 Aug – 31 Aug", in IST. One date where the feed carried only one, null
 * where it carried neither.
 *
 * Dates only, never a clock time: half the rows have times the vendor never
 * sent, and a line that prints "10:00 am" on some rows and not others makes
 * the invented ones look like the reported ones.
 */
export function windowDatesLabel(window: IpoBiddingWindow): string | null {
  const opens = istDayLabel(window.opensAt);
  const closes = istDayLabel(window.closesAt);
  if (opens && closes) return opens === closes ? opens : `${opens} – ${closes}`;
  if (closes) return `Closes ${closes}`;
  if (opens) return `Opens ${opens}`;
  return null;
}
