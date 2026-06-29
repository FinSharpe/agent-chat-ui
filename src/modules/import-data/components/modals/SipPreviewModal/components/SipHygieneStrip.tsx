/**
 * SIP registry & account-hygiene strip — four KPI tiles plus an actionable
 * nominee-gap nudge. Built entirely from the `Profile` block, so it's real data
 * today (unlike the gated performance dashboard).
 */

"use client";
import {
  AlertTriangle,
  Building2,
  Repeat,
  ShieldCheck,
  UserX,
} from "lucide-react";
import {
  SectionLabel,
  StatTile,
  type SurfaceIntent,
} from "@/modules/import-data/components/shared/ui";
import { SipHygiene } from "@/modules/import-data/types/sip";

export function SipHygieneStrip({ hygiene }: { hygiene: SipHygiene }) {
  const { registrations, kycCompliant, kycTotal, nomineeGap, fundHouses } =
    hygiene;

  const allKycDone = kycTotal > 0 && kycCompliant === kycTotal;
  const kycIntent: SurfaceIntent = allKycDone ? "positive" : "warning";
  const nomineeIntent: SurfaceIntent = nomineeGap > 0 ? "warning" : "positive";

  return (
    <section>
      <SectionLabel className="mb-2.5">
        Registry &amp; account hygiene
      </SectionLabel>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile
          label="Registrations"
          value={registrations}
          icon={Repeat}
          intent="neutral"
          hint="Active SIP folios"
        />
        <StatTile
          label="KYC compliant"
          value={kycTotal > 0 ? `${kycCompliant}/${kycTotal}` : "—"}
          icon={ShieldCheck}
          intent={kycIntent}
          hint={allKycDone ? "All holders verified" : "Action may be needed"}
        />
        <StatTile
          label="Nominee gap"
          value={nomineeGap}
          icon={nomineeGap > 0 ? UserX : ShieldCheck}
          intent={nomineeIntent}
          hint={
            nomineeGap > 0 ? "Folios with no nominee" : "All folios covered"
          }
        />
        <StatTile
          label="Fund houses"
          value={fundHouses.length}
          icon={Building2}
          intent="info"
          hint={fundHouses.length ? fundHouses.join(" · ") : undefined}
        />
      </div>

      {nomineeGap > 0 && (
        <div className="border-warning-border bg-warning-bg text-warning-fg mt-3 flex items-start gap-2.5 rounded-xl border p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">
              {nomineeGap === registrations
                ? `No nominee set on any of your ${registrations} SIP folios.`
                : `${nomineeGap} of your ${registrations} SIP folios have no nominee.`}
            </span>{" "}
            Registering a nominee with your registrar avoids transmission
            hassles for your heirs and is a quick online update.
          </p>
        </div>
      )}
    </section>
  );
}
