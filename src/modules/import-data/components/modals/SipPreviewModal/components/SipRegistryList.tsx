/**
 * The registrar's SIP registrations as hairline rows: fund house and folio on
 * the left, registrar and holder on the right.
 */

"use client";
import { DataPanel } from "@/modules/import-data/components/shared/ui";
import type { SIPDisplayData } from "@/modules/import-data/types/sip";

const dash = (v?: string) => (v && v !== "-" ? v : "—");

export function SipRegistryList({ rows }: { rows: SIPDisplayData[] }) {
  return (
    <DataPanel
      title="Registrations"
      addon={`${rows.length} folio${rows.length === 1 ? "" : "s"}`}
      bodyClassName="divide-border-subtle -my-2 divide-y"
    >
      {rows.map((row, i) => (
        <div
          key={`${row.maskedAccountNumber}-${i}`}
          className="flex items-center justify-between gap-2 py-2.5"
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
            <p className="text-forest-deep text-[11px] font-medium dark:text-white">
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
