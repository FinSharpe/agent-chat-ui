/**
 * SIP performance dashboard — the unlocked counterpart to
 * {@link SipLockedAnalytics}. Renders from the normalized {@link SipAnalytics}
 * model, degrading any unshared datum to an em-dash: a totals line, the
 * allocation donut by fund house and the per-scheme table, as reference cards.
 * (The headline value / returns / monthly figures sit in the stat tiles.)
 */

"use client";
import { BarChart3, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DataPanel,
  DonutBreakdown,
  formatCount,
  formatINRShort,
  formatPct,
} from "@/modules/import-data/components/shared/ui";
import { SipAnalytics } from "@/modules/import-data/types/sip";

const returnsClass = (v: number | null) =>
  v === null ? "text-slate-400" : v >= 0 ? "text-[#0A9E6E]" : "text-rose-500";

export function SipAnalyticsDashboard({
  analytics,
}: {
  analytics: SipAnalytics;
}) {
  const { totalInvested, installmentCount, nextDebitDate, perScheme } =
    analytics;

  // Allocation by fund house — share by current value, falling back to invested.
  const allocation = perScheme.map((s) => ({
    name: s.fundHouse,
    value: s.currentValue ?? s.invested ?? 0,
  }));

  // Fragment: each card is a direct child of the modal's scroll column.
  return (
    <>
      <DataPanel
        title="Performance Analytics"
        icon={BarChart3}
        iconClassName="text-purple-500"
        addon={nextDebitDate ? `next debit ${nextDebitDate}` : undefined}
        bodyClassName="space-y-4"
      >
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {formatINRShort(totalInvested)} invested
          {installmentCount
            ? ` across ${formatCount(installmentCount)} installments`
            : ""}
          .
        </p>
        <table className="w-full table-fixed border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-slate-50 font-medium text-slate-400 uppercase dark:border-slate-800">
              <th className="pb-2 font-medium">Fund house</th>
              <th className="w-[4.5rem] pb-2 text-right font-medium">SIP/mo</th>
              <th className="hidden w-[5.5rem] pb-2 text-right font-medium sm:table-cell">
                Invested
              </th>
              <th className="w-[5.5rem] pb-2 text-right font-medium">
                Current
              </th>
              <th className="w-[4.5rem] pb-2 text-right font-medium">Return</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50/50 dark:divide-slate-800/30">
            {perScheme.map((s) => (
              <tr key={s.maskedAccountNumber}>
                <td className="py-2.5 pr-2">
                  <span className="text-forest-deep block truncate font-medium dark:text-white">
                    {s.fundHouse}
                  </span>
                  <span className="block truncate text-[9px] text-slate-400">
                    {s.maskedAccountNumber}
                  </span>
                </td>
                <td className="py-2.5 text-right text-slate-500 tabular-nums">
                  {formatINRShort(s.monthlySip)}
                </td>
                <td className="hidden py-2.5 text-right text-slate-500 tabular-nums sm:table-cell">
                  {formatINRShort(s.invested)}
                </td>
                <td className="text-forest-deep py-2.5 text-right font-medium tabular-nums dark:text-white">
                  {formatINRShort(s.currentValue)}
                </td>
                <td
                  className={cn(
                    "py-2.5 text-right font-medium tabular-nums",
                    returnsClass(s.returnsPct),
                  )}
                >
                  {formatPct(s.returnsPct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataPanel>

      {allocation.some((a) => a.value > 0) && (
        <DataPanel
          title="Allocation by Fund House"
          icon={PieChart}
        >
          <DonutBreakdown segments={allocation} />
        </DataPanel>
      )}
    </>
  );
}
