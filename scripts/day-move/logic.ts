/**
 * The net-worth card's day move: the per-class rupee move, the sum across the
 * invested book, and the rule that a book with any class missing its move shows
 * no line at all. The rules are finsharpe-mobile's (`_SummaryCard` in
 * `portfolio_tab.dart`, `ClassAnalytics.dayMoveInr` in `analytics_api.dart`),
 * so these cases are the web half of that contract.
 */
import type { FiBlob, NormalizedHolding } from "@/modules/import-data/types/aa";
import {
  classItems,
  dayMoveInr,
  dayMoveLine,
  dayMovePill,
  portfolioDayMove,
} from "@/modules/import-data/utils/day-move";

let failures = 0;
function eq(actual: unknown, expected: unknown, name: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${name}\n  got:      ${a}\n  expected: ${e}`);
  } else {
    console.log(`ok   ${name}`);
  }
}
const round2 = (n: number | null) =>
  n == null ? null : Math.round(n * 100) / 100;

const holding = (isin: string, units: number): NormalizedHolding => ({
  isin,
  name: isin,
  units,
});
const blob = (holdings: NormalizedHolding[]): FiBlob => ({
  consentID: "c",
  type: "EQUITIES",
  fetchedAt: "2026-09-25T10:00:00Z",
  normalized: { assetClass: "EQUITIES", accountCount: 1, holdings },
});

// --- one class's rupee move ---------------------------------------------------
eq(round2(dayMoveInr(101_000, 1)), 1000, "a 1% day on ₹1,01,000 is ₹1,000");
eq(round2(dayMoveInr(99_000, -1)), -1000, "a -1% day on ₹99,000 is -₹1,000");
eq(dayMoveInr(50_000, 0), 0, "a flat day moves nothing");
eq(dayMoveInr(50_000, -100), null, "a -100% move has no yesterday");

// --- the book -----------------------------------------------------------------
{
  const move = portfolioDayMove(
    [
      { value: 101_000, pct: 1 },
      { value: 99_000, pct: -1 },
    ],
    200_000,
  );
  eq(round2(move?.delta ?? null), 0, "offsetting classes net to zero");
  eq(round2(move?.pct ?? null), 0, "and to zero percent");
}
{
  const move = portfolioDayMove(
    [
      { value: 101_000, pct: 1 },
      { value: 51_000, pct: 2 },
    ],
    152_000,
  );
  eq(round2(move?.delta ?? null), 2000, "moves sum across classes");
  // Against yesterday's ₹1,50,000, as brokers quote a day change.
  eq(round2(move?.pct ?? null), 1.33, "percent is relative to yesterday");
}
eq(
  portfolioDayMove(
    [
      { value: 101_000, pct: 1 },
      { value: 50_000, pct: null },
    ],
    151_000,
  ),
  null,
  "one class without a move hides the line",
);
eq(
  portfolioDayMove([{ value: null, pct: 1 }], 0),
  null,
  "a class with no value hides the line",
);
eq(portfolioDayMove([], 0), null, "no invested class, no line");

// --- the request lines ----------------------------------------------------------
eq(
  classItems([
    blob([holding("INE002A01018", 10), holding("INE040A01034", 5)]),
    blob([holding("INE002A01018", 4)]),
  ]),
  [
    { isin: "INE002A01018", quantity: 14 },
    { isin: "INE040A01034", quantity: 5 },
  ],
  "the same ISIN in two accounts is one line, units summed",
);
eq(
  classItems([blob([holding("", 3), holding("", 2)])]),
  [
    { isin: "", quantity: 3 },
    { isin: "", quantity: 2 },
  ],
  "holdings without an ISIN are not merged together",
);

// --- the copy -----------------------------------------------------------------
eq(dayMoveLine(4213.4), "+₹4,213 today", "gain line, whole rupees");
eq(dayMoveLine(-123456.6), "-₹1,23,457 today", "loss line, Indian grouping");
eq(dayMoveLine(0), "+₹0 today", "a flat day reads as a gain");
eq(dayMovePill(0.4213), "+0.42% today", "pill, two decimals");
eq(dayMovePill(-1.5), "-1.50% today", "pill, loss");

if (failures > 0) {
  console.log(`\n${failures} failing`);
  process.exit(1);
}
