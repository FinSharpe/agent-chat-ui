/**
 * Locked placeholder for SIP performance analytics. Shown while the analytics
 * are gated (no `Summary`/`Transactions` yet). Sets the expectation that the
 * section will fill in automatically — the same slot renders the real
 * dashboard the moment the registrar shares the data, with no further work.
 */

"use client";
import { BarChart3, Lock } from "lucide-react";
import { Badge, DataPanel } from "@/modules/import-data/components/shared/ui";

const FACETS = [
  "Total invested",
  "Current value",
  "XIRR / returns",
  "Monthly commitment",
  "Per-fund split",
  "Installment timeline",
];

export function SipLockedAnalytics() {
  return (
    <DataPanel
      title="Performance Analytics"
      icon={BarChart3}
      iconClassName="text-purple-500"
      bodyClassName="flex flex-col items-center gap-3 py-4 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#063BAA]/8 text-[#063BAA]">
        <Lock size={22} />
      </div>
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-medium tracking-wider text-amber-700 uppercase dark:bg-amber-500/10 dark:text-amber-400">
        Awaiting registrar data
      </span>
      <p className="text-forest-deep text-[13px] font-medium dark:text-white">
        Performance analytics will unlock automatically
      </p>
      <p className="max-w-[420px] text-[11px] leading-relaxed text-slate-400">
        Invested amount, current value, returns and installment history appear
        here once your registrar shares the Summary and Transaction data for
        your SIPs. This view is already wired to render them the moment they
        arrive.
      </p>
      <div className="flex flex-wrap justify-center gap-1.5 pt-1">
        {FACETS.map((facet) => (
          <Badge key={facet}>{facet}</Badge>
        ))}
      </div>
    </DataPanel>
  );
}
