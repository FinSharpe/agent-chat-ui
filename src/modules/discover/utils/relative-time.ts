/**
 * One relative-time voice for Discover's feeds, ported from finsharpe-mobile
 * `lib/core/relative_time.dart` so a headline stamped "2 h ago" on the phone
 * is stamped "2 h ago" here.
 */

export const MONTHS_SHORT = [
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

/** "just now" / "5 min ago" / "2 h ago" / "3 d ago" / "6 Jul". */
export function relativeTime(time: Date, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - time.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d ago`;
  return `${time.getDate()} ${MONTHS_SHORT[time.getMonth()]}`;
}

/** "6 Jul 2027". */
export const shortDate = (date: Date) =>
  `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;

/** Whether two instants fall on the same calendar day, in the reader's zone. */
export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
