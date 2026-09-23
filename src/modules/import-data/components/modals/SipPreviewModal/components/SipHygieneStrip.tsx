/**
 * SIP registry & account-hygiene card — four figures in the reference
 * snapshot-tile style plus an actionable nominee-gap nudge. Built entirely
 * from the `Profile` block, so it's real data today (unlike the gated
 * performance dashboard).
 */

"use client";
import { cn } from "@/lib/utils";
import {
  DataPanel,
  Notice,
  TagChip,
} from "@/modules/import-data/components/shared/ui";
import { SipHygiene } from "@/modules/import-data/types/sip";

function Figure({
  value,
  label,
  desc,
  tone = "brand",
}: {
  value: string | number;
  label: string;
  desc: string;
  tone?: "brand" | "good" | "warn";
}) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p
        className={cn(
          "font-geist text-base font-medium tabular-nums",
          tone === "good" && "text-[#0A9E6E]",
          tone === "warn" && "text-amber-600",
          tone === "brand" && "text-forest-deep dark:text-white",
        )}
      >
        {value}
      </p>
      <p className="text-forest-deep text-[9px] font-medium dark:text-white">
        {label}
      </p>
      <p className="truncate text-[8px] leading-none text-slate-400">{desc}</p>
    </div>
  );
}

export function SipHygieneStrip({
  hygiene,
  showFigures = true,
}: {
  hygiene: SipHygiene;
  /** Off while the stat tiles above already show the hygiene figures. */
  showFigures?: boolean;
}) {
  const { registrations, kycCompliant, kycTotal, nomineeGap, fundHouses } =
    hygiene;
  const allKycDone = kycTotal > 0 && kycCompliant === kycTotal;

  return (
    <DataPanel
      title="KYC & nominee health"
      bodyClassName="space-y-3"
    >
      {showFigures && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Figure
            value={registrations}
            label="Registrations"
            desc="Active SIP folios"
          />
          <Figure
            value={kycTotal > 0 ? `${kycCompliant}/${kycTotal}` : "—"}
            label="KYC Compliant"
            desc={allKycDone ? "All holders verified" : "Action may be needed"}
            tone={allKycDone ? "good" : "warn"}
          />
          <Figure
            value={nomineeGap}
            label="Nominee Gap"
            desc={
              nomineeGap > 0 ? "Folios with no nominee" : "All folios covered"
            }
            tone={nomineeGap > 0 ? "warn" : "good"}
          />
          <Figure
            value={fundHouses.length}
            label="Fund Houses"
            desc="Across registrars"
          />
        </div>
      )}

      {fundHouses.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {!showFigures && (
            <span className="mr-1 text-[10px] text-slate-500 dark:text-slate-400">
              {fundHouses.length} fund house{fundHouses.length === 1 ? "" : "s"}
            </span>
          )}
          {fundHouses.map((f) => (
            <TagChip key={f}>{f}</TagChip>
          ))}
        </div>
      )}

      {nomineeGap > 0 && (
        <Notice tone="warning">
          <span className="font-medium">
            {nomineeGap === registrations
              ? `No nominee set on any of your ${registrations} SIP folios.`
              : `${nomineeGap} of your ${registrations} SIP folios have no nominee.`}
          </span>{" "}
          Registering a nominee with your registrar avoids transmission hassles
          for your heirs and is a quick online update.
        </Notice>
      )}
    </DataPanel>
  );
}
