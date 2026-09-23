/**
 * Smart Alerts grouped by asset class (#86): the grouping the card draws, the
 * served alert shape, and the SIP rules worked out in the browser. The rules
 * are shared with finsharpe-mobile (`smart_alerts.dart`, `local_alerts.dart`,
 * its `smart_alerts_test.dart`), so these cases are the web half of that
 * contract.
 */
import type { SmartAlert as ServedAlert } from "@/api/generated/nudge-apis/models";
import {
  allClearLine,
  emphasisRuns,
  formatInrExact,
  fromServed,
  groupSmartAlerts,
  metaLine,
  sipAlerts,
  type AlertClass,
  type SmartAlertItem,
} from "@/modules/import-data/utils/smart-alerts";
import type { ActiveSip } from "@/modules/import-data/types/aa";

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

const alert = (assetClass: AlertClass, title: string): SmartAlertItem => ({
  assetClass,
  kind: "score",
  title,
  question: `Q ${title}`,
});

const sip = (o: Partial<ActiveSip> = {}): ActiveSip => ({
  isin: "INF846K01CH7",
  schemeName: "Axis Small Cap Fund",
  installmentAmount: 5000,
  cadence: "monthly",
  installmentsInWindow: 1,
  source: "narration",
  lastDebitDate: "2026-08-07",
  nextDebitEstimate: "2026-09-07",
  ...o,
});

const served = (o: Record<string, unknown>) => o as unknown as ServedAlert;

// --- grouping ---------------------------------------------------------------
{
  const groups = groupSmartAlerts({
    held: ["SIP", "EQUITIES", "ETF"],
    alerts: [
      alert("SIP", "S1"),
      ...[1, 2, 3, 4, 5, 6, 7].map((i) => alert("EQUITIES", `E${i}`)),
      alert("ETF", "T1"),
      // Not held: dropped, not grouped.
      alert("MUTUAL_FUNDS", "M1"),
    ],
    checked: () => true,
  });
  eq(
    groups.map((g) => g.assetClass),
    ["EQUITIES", "ETF", "SIP"],
    "one group per held class, in card order",
  );
  eq(
    groups[0].alerts.map((a) => a.title),
    ["E1", "E2", "E3", "E4", "E5"],
    "served order kept within a class, capped at five",
  );
}
{
  const groups = groupSmartAlerts({
    held: ["EQUITIES", "SIP"],
    alerts: [],
    checked: (type) => type === "SIP",
  });
  eq(
    groups.map((g) => g.assetClass),
    ["SIP"],
    "a class whose feed failed is left out, not called clear",
  );
  eq(
    allClearLine("SIP"),
    "Nothing to flag in your SIPs today.",
    "SIP all-clear line",
  );
  eq(
    allClearLine("ETF"),
    "Nothing to flag in your ETFs today.",
    "ETF all-clear line",
  );
  eq(
    allClearLine("MUTUAL_FUNDS"),
    "Nothing to flag in your mutual funds today.",
    "mutual funds all-clear line",
  );
}

// --- the served alert -------------------------------------------------------
{
  const a = fromServed(
    served({
      assetClass: "MUTUAL_FUNDS",
      kind: "expense_ratio",
      holding: { type: "mf", isin: "INF", name: "Quant Active Fund" },
      title: "Quant Active Fund",
      badge: { label: "Above category", tone: "negative" },
      meta: "Expense ratio",
      line: "Charges 0.77% a year against a category median of 0.58%.",
      question: "Is the extra cost earning its keep?",
    }),
  )!;
  eq(a.assetClass, "MUTUAL_FUNDS", "reads the served class");
  eq(
    metaLine(a),
    "Above category · Expense ratio",
    "meta line is verdict · meta",
  );
  eq(
    a.question,
    "Is the extra cost earning its keep?",
    "question sent as served",
  );
}
eq(
  fromServed(
    served({ assetClass: "CRYPTO", title: "X", holding: { isin: "X" } }),
  ),
  null,
  "an unknown class is skipped",
);
eq(
  fromServed(
    served({
      assetClass: "ETF",
      title: "Nifty BeES",
      holding: { isin: "INF" },
      badge: { label: "Concentration", tone: "negative" },
      line: "18% of your equity rides on HDFC Bank",
    }),
  )?.question,
  "Explain this alert on Nifty BeES: Concentration — 18% of your equity rides on HDFC Bank. What does it mean for my portfolio?",
  "a missing question is built from the verdict and line",
);
eq(
  metaLine({ badge: { label: "Strong", tone: "positive" }, meta: null }),
  "Strong",
  "meta line without a figure is the verdict alone",
);

// --- SIPs -------------------------------------------------------------------
const today = new Date(2026, 8, 24);
{
  const alerts = sipAlerts([sip()], { transactionsEnd: "2026-09-20", today });
  eq(alerts.length, 1, "missed: one alert");
  eq(
    alerts[0]?.kind,
    "sip_missed",
    "missed when the statement runs past due + grace",
  );
  eq(metaLine(alerts[0]), "Missed · September installment", "missed meta line");
  eq(
    alerts[0]?.line,
    "No September installment of ₹5,000 seen. The last one debited on 7 Aug.",
    "missed line",
  );
}
eq(
  sipAlerts([sip()], { transactionsEnd: "2026-09-10", today }),
  [],
  "inside the grace: not missed",
);
eq(
  sipAlerts([sip()], { transactionsEnd: "2026-08-20", today }),
  [],
  "an old statement, due date long past today: says nothing",
);
{
  const alerts = sipAlerts(
    [
      sip({
        schemeName: "Later",
        installmentAmount: 2000,
        lastDebitDate: "2026-08-29",
        nextDebitEstimate: "2026-09-29",
      }),
      sip({
        schemeName: "Soon",
        installmentAmount: 4999.75,
        lastDebitDate: "2026-08-25",
        nextDebitEstimate: "2026-09-25",
      }),
      sip({
        schemeName: "Too far",
        lastDebitDate: "2026-09-05",
        nextDebitEstimate: "2026-10-05",
      }),
      sip({
        schemeName: "Weekly",
        cadence: "weekly",
        nextDebitEstimate: "2026-09-25",
      }),
      sip(), // missed
    ],
    { transactionsEnd: "2026-09-20", today },
  );
  eq(
    alerts.map((a) => a.title),
    ["Axis Small Cap Fund", "Soon", "Later"],
    "missed first, then upcoming within seven days, soonest first",
  );
  eq(metaLine(alerts[1]), "Upcoming · 25 Sep", "upcoming meta line");
  eq(
    alerts[1]?.line,
    "₹4,999.75 is expected to debit around 25 Sep, tomorrow.",
    "the installment exactly as observed, never grossed up",
  );
  eq(alerts[2]?.line?.includes("in 5 days"), true, "days until the debit");
}
eq(
  sipAlerts([sip({ nextDebitEstimate: "2026-09-26" })], {
    transactionsEnd: null,
    today,
  }).map((a) => a.kind),
  ["sip_upcoming"],
  "no statement end: upcoming still judged against today",
);
eq(formatInrExact(134324.5), "₹1,34,324.50", "Indian grouping with paise");

// --- emphasis ---------------------------------------------------------------
eq(
  emphasisRuns("Up 12.5% to ₹1,200 today").map((r) => [r.text, r.strong]),
  [
    ["Up ", false],
    ["12.5%", true],
    [" to ", false],
    ["₹1,200", true],
    [" today", false],
  ],
  "₹ amounts and percentages are the bold runs",
);
eq(
  emphasisRuns("Score 80 of 100").every((r) => !r.strong),
  true,
  "a bare number is not bolded",
);

if (failures > 0) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
