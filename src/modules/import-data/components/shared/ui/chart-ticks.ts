/** Time-axis helpers shared by the Import modals' trend charts. */

/** First-of-month timestamps inside the data range — one tick per month
 *  (every other month on long runs) instead of repeated month labels. */
export function monthTicks(first: number, last: number): number[] {
  const ticks: number[] = [];
  const d = new Date(first);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + 1);
  while (d.getTime() <= last) {
    ticks.push(d.getTime());
    d.setMonth(d.getMonth() + 1);
  }
  return ticks.length > 7 ? ticks.filter((_, i) => i % 2 === 0) : ticks;
}

/** "Mar" style month label for a timestamp tick. */
export const monthLabel = (t: unknown) =>
  new Intl.DateTimeFormat("en-IN", { month: "short" }).format(
    new Date(Number(t)),
  );
