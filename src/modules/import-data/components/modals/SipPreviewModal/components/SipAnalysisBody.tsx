"use client";
import { Repeat } from "lucide-react";
import type {
  SIPDisplayData,
  SipAnalytics,
  SipHygiene,
} from "@/modules/import-data/types/sip";
import {
  EmptyState,
  Notice,
  StatGrid,
  StatTile,
  formatINRShort,
  formatPct,
} from "@/modules/import-data/components/shared/ui";
import type { MfSipSummary } from "../hooks/useMfSips";
import { ActiveSipsList, SipSummaryTiles } from "./ActiveSips";
import { SipAnalyticsDashboard } from "./SipAnalyticsDashboard";
import { SipHygieneStrip } from "./SipHygieneStrip";
import { SipRegistryList } from "./SipRegistryList";

/** Registrar-reported performance (gated build-ahead: renders once the SIP
 *  consent shares Summary/Transactions). */
function RegistrarPerformance({ analytics }: { analytics: SipAnalytics }) {
  return (
    <>
      <StatGrid>
        <StatTile
          label="Current Value"
          value={formatINRShort(analytics.totalCurrentValue)}
          hint={`${formatINRShort(analytics.totalInvested)} invested`}
        />
        <StatTile
          label="Returns"
          value={formatPct(analytics.returnsPct)}
          intent={
            analytics.returnsPct === null
              ? "neutral"
              : analytics.returnsPct >= 0
                ? "positive"
                : "negative"
          }
          hint="absolute"
        />
        <StatTile
          label="Monthly SIP"
          value={formatINRShort(analytics.monthlyCommitment)}
          hint="total commitment"
        />
      </StatGrid>
      <SipAnalyticsDashboard analytics={analytics} />
    </>
  );
}

/**
 * The SIP view in finsharpe-mobile's order (`sips_screen.dart`): the money
 * first — monthly commitment, next debit, value, and the SIPs detected in the
 * mutual-funds consent — then the registrar's registrations with their KYC and
 * nominee health, one quiet line for whichever source is missing, and the
 * net-worth note.
 */
export function SipAnalysisBody({
  rows,
  hygiene,
  registrarAnalytics,
  mf,
}: {
  rows: SIPDisplayData[];
  hygiene: SipHygiene;
  registrarAnalytics: SipAnalytics | null;
  mf: MfSipSummary;
}) {
  if (rows.length === 0 && mf.sips.length === 0) {
    return (
      <EmptyState
        icon={Repeat}
        title="No SIP registrations found"
        description="There are no active Systematic Investment Plans to show for this connection."
        className="py-16"
      />
    );
  }

  return (
    <>
      {registrarAnalytics ? (
        <RegistrarPerformance analytics={registrarAnalytics} />
      ) : (
        <>
          <SipSummaryTiles s={mf} />
          <ActiveSipsList s={mf} />
        </>
      )}

      {rows.length > 0 && (
        <>
          <SipRegistryList rows={rows} />
          <SipHygieneStrip hygiene={hygiene} />
        </>
      )}

      {!registrarAnalytics && mf.sips.length === 0 && (
        <Notice tone="info">
          {!mf.mfConnected
            ? "Connect Mutual Funds to see your SIPs' amounts and next debits — the registrar shares registrations only."
            : mf.mfPending
              ? "Your mutual funds haven't synced yet — SIP amounts appear here once they do."
              : "No recurring installments were found in your mutual fund statements."}
        </Notice>
      )}

      <p className="text-[10px] leading-relaxed text-slate-400">
        SIP contributions are shown for awareness and are not added to your net
        worth. The invested value already appears under mutual funds.
      </p>
    </>
  );
}
