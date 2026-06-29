/**
 * SIP performance dashboard — the unlocked counterpart to
 * {@link SipLockedAnalytics}. Renders from the normalized {@link SipAnalytics}
 * model, degrading any unshared datum to an em-dash. First-pass layout (KPI
 * tiles · allocation · per-scheme); chart fidelity will be tightened once the
 * registrar's Summary/Transaction schema is confirmed.
 */

"use client";
import { CalendarClock, IndianRupee, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DataPanel,
  SectionLabel,
  StatTile,
  formatCount,
  formatINR,
  formatINRCompact,
  type SurfaceIntent,
} from "@/modules/import-data/components/shared/ui";
import { SipAnalytics } from "@/modules/import-data/types/sip";

/** Distinct, repeating hues for the allocation bar / legend. */
const PALETTE = [
  "#2563eb",
  "#10b981",
  "#6366f1",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
];

function pct(value: number | null): string {
  return value === null ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function returnsIntent(value: number | null): SurfaceIntent {
  if (value === null) return "neutral";
  return value >= 0 ? "positive" : "negative";
}

export function SipAnalyticsDashboard({
  analytics,
}: {
  analytics: SipAnalytics;
}) {
  const {
    totalInvested,
    totalCurrentValue,
    absoluteReturn,
    returnsPct,
    monthlyCommitment,
    installmentCount,
    nextDebitDate,
    perScheme,
  } = analytics;

  // Allocation by fund house — share by current value, falling back to invested.
  const allocBase = perScheme.map((s) => ({
    label: s.fundHouse,
    amount: s.currentValue ?? s.invested ?? 0,
  }));
  const allocTotal = allocBase.reduce((acc, a) => acc + a.amount, 0);
  const allocation =
    allocTotal > 0
      ? allocBase.map((a, i) => ({
          ...a,
          share: (a.amount / allocTotal) * 100,
          color: PALETTE[i % PALETTE.length],
        }))
      : [];

  return (
    <div className="flex flex-col gap-5">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile
          label="Total invested"
          value={formatINRCompact(totalInvested)}
          icon={Wallet}
          intent="neutral"
          hint={
            installmentCount
              ? `across ${formatCount(installmentCount)} installments`
              : undefined
          }
        />
        <StatTile
          label="Current value"
          value={formatINRCompact(totalCurrentValue)}
          icon={IndianRupee}
          intent="positive"
          hint="as of latest NAV"
        />
        <StatTile
          label="Returns (XIRR)"
          value={pct(returnsPct)}
          icon={TrendingUp}
          intent={returnsIntent(returnsPct)}
          hint={
            absoluteReturn !== null
              ? `${formatINRCompact(absoluteReturn)} absolute`
              : undefined
          }
        />
        <StatTile
          label="Monthly commitment"
          value={formatINRCompact(monthlyCommitment)}
          icon={CalendarClock}
          intent="info"
          hint={nextDebitDate ? `next debit ${nextDebitDate}` : "per month"}
        />
      </div>

      {/* Allocation by fund house */}
      {allocation.length > 0 && (
        <section>
          <SectionLabel className="mb-2.5">
            Allocation by fund house
          </SectionLabel>
          <div className="flex flex-col gap-2.5">
            <div className="bg-bg-subtle flex h-3 overflow-hidden rounded-full">
              {allocation.map((a) => (
                <span
                  key={a.label}
                  style={{ width: `${a.share}%`, backgroundColor: a.color }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {allocation.map((a) => (
                <span
                  key={a.label}
                  className="text-text-secondary flex items-center gap-1.5 text-xs"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: a.color }}
                  />
                  {a.label} {formatINRCompact(a.amount)} · {a.share.toFixed(0)}%
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Per-scheme breakdown */}
      <section>
        <SectionLabel className="mb-2.5">Per-scheme breakdown</SectionLabel>
        <DataPanel noPadding>
          <div className="scrollbar-thin overflow-auto">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  {[
                    "Fund house",
                    "SIP / mo",
                    "Invested",
                    "Current",
                    "Returns",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        "border-border-subtle bg-bg-subtle text-text-tertiary border-b px-3 py-2.5 text-[11px] font-semibold tracking-[0.06em] uppercase",
                        i === 0 ? "text-left" : "text-right",
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {perScheme.map((s) => (
                  <tr
                    key={s.maskedAccountNumber}
                    className="hover:bg-bg-hover transition-colors"
                  >
                    <td className="border-border-subtle text-text-primary border-b px-3 py-2.5 font-medium">
                      {s.fundHouse}
                    </td>
                    <td className="border-border-subtle text-text-secondary border-b px-3 py-2.5 text-right tabular-nums">
                      {formatINR(s.monthlySip)}
                    </td>
                    <td className="border-border-subtle text-text-secondary border-b px-3 py-2.5 text-right tabular-nums">
                      {formatINR(s.invested)}
                    </td>
                    <td className="border-border-subtle text-text-secondary border-b px-3 py-2.5 text-right tabular-nums">
                      {formatINR(s.currentValue)}
                    </td>
                    <td
                      className={cn(
                        "border-border-subtle border-b px-3 py-2.5 text-right font-medium tabular-nums",
                        s.returnsPct === null
                          ? "text-text-secondary"
                          : s.returnsPct >= 0
                            ? "text-success-fg"
                            : "text-error-fg",
                      )}
                    >
                      {pct(s.returnsPct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataPanel>
      </section>
    </div>
  );
}
