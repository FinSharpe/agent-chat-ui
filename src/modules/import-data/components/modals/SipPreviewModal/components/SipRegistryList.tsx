/**
 * Registered SIP folios as the reference "Active SIPs" rows: purple-tinted
 * rows with the fund house and folio on the left, registrar and holder on the
 * right.
 */

"use client";
import { RefreshCw } from "lucide-react";
import { DataPanel } from "@/modules/import-data/components/shared/ui";
import type { SIPDisplayData } from "@/modules/import-data/types/sip";

const dash = (v?: string) => (v && v !== "-" ? v : "—");

export function SipRegistryList({ rows }: { rows: SIPDisplayData[] }) {
  return (
    <DataPanel
      title="Registered SIP Folios"
      icon={RefreshCw}
      iconClassName="text-purple-500"
      addon={`${rows.length} folio${rows.length === 1 ? "" : "s"}`}
      bodyClassName="space-y-2"
    >
      {rows.map((row, i) => (
        <div
          key={`${row.maskedAccountNumber}-${i}`}
          className="rounded-nested flex items-center justify-between gap-2 bg-purple-50/50 px-3 py-2.5 dark:bg-purple-500/5"
        >
          <div className="min-w-0">
            <p className="text-forest-deep truncate text-[11px] font-medium dark:text-white">
              {dash(row.fundHouse)}
            </p>
            <p className="truncate text-[9px] text-slate-400">
              {dash(row.maskedAccountNumber)}
            </p>
          </div>
          <div className="min-w-0 shrink-0 text-right">
            <p className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
              {dash(row.registrar)}
            </p>
            <p className="max-w-[140px] truncate text-[9px] text-slate-400">
              {dash(row.holderName)}
            </p>
          </div>
        </div>
      ))}
    </DataPanel>
  );
}
