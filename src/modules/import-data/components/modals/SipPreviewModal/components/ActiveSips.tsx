"use client";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DataPanel,
  StatTile,
  formatINR,
  formatINRShort,
  formatPct,
} from "@/modules/import-data/components/shared/ui";
import type { MfSipSummary } from "../hooks/useMfSips";

const day = (iso: string | null | undefined, pattern = "d MMM") => {
  if (!iso) return null;
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return null;
  }
};

/**
 * Monthly commitment, next debit, invested and value — mobile's SIP
 * `_SummaryStrip`. Only monthly SIPs are in the monthly figure; no other
 * cadence is converted. Invested appears only when the detected SIPs are the
 * whole fund book. A tile with no data is left out.
 */
export function SipSummaryTiles({ s }: { s: MfSipSummary }) {
  const tiles = [];
  if (s.monthlyCount > 0)
    tiles.push(
      <StatTile
        key="monthly"
        label="Monthly"
        value={formatINRShort(s.monthlyCommitment)}
        hint={
          s.monthlyCount === s.sips.length
            ? `${s.monthlyCount} active SIP${s.monthlyCount === 1 ? "" : "s"}`
            : `${s.monthlyCount} of ${s.sips.length} SIPs, monthly`
        }
      />,
    );
  if (s.nextDebit)
    tiles.push(
      <StatTile
        key="next"
        label="Next debit"
        value={`Est. ${day(s.nextDebit.date) ?? s.nextDebit.date}`}
        hint={
          s.nextDebit.datedCount > 1
            ? `next of ${s.nextDebit.datedCount} SIPs`
            : s.nextDebit.sip.cadence
        }
      />,
    );
  if (s.invested)
    tiles.push(
      <StatTile
        key="invested"
        label="Invested"
        value={formatINRShort(s.invested.cost)}
        hint="as reported by your account"
      />,
    );
  if (s.value != null) {
    const gain = s.invested ? s.invested.coveredValue - s.invested.cost : null;
    tiles.push(
      <StatTile
        key="value"
        label="Value"
        value={formatINRShort(s.value)}
        intent={gain === null ? "neutral" : gain >= 0 ? "positive" : "negative"}
        hint={
          gain === null || !s.invested
            ? "of the schemes you run SIPs in"
            : `${formatINRShort(gain, { signed: true })} · ${formatPct((gain / s.invested.cost) * 100)}`
        }
      />,
    );
  }
  if (tiles.length === 0) return null;
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2",
        tiles.length === 4 && "sm:grid-cols-4",
      )}
    >
      {tiles}
    </div>
  );
}

/** The detected SIPs as one divided card, under the window the detection read. */
export function ActiveSipsList({ s }: { s: MfSipSummary }) {
  if (s.sips.length === 0) return null;
  const end = day(s.windowEnd, "d MMM yyyy");
  return (
    <DataPanel
      title="Active SIPs"
      addon={end ? `transactions to ${end}` : undefined}
    >
      <div className="divide-border-subtle -my-2 divide-y">
        {s.sips.map((sip) => {
          const last = day(sip.lastDebitDate);
          const next = day(sip.nextDebitEstimate);
          return (
            <div
              key={`${sip.isin}-${sip.installmentAmount}`}
              className="flex items-center justify-between gap-3 py-2.5 text-[11px]"
            >
              <div className="min-w-0">
                <p className="text-forest-deep truncate font-medium dark:text-white">
                  {sip.schemeName || sip.isin}
                </p>
                <p className="truncate text-[9.5px] text-slate-400">
                  {[
                    sip.cadence,
                    `${sip.installmentsInWindow} in window`,
                    last && `last ${last}`,
                    next && `next est. ${next}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <span className="text-forest-deep shrink-0 font-medium tabular-nums dark:text-white">
                {formatINR(sip.installmentAmount)}
              </span>
            </div>
          );
        })}
      </div>
    </DataPanel>
  );
}
