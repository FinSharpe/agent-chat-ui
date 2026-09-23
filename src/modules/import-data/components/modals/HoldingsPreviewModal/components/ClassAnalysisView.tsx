"use client";
import { Loader2 } from "lucide-react";
import SectionErrorState from "@/components/shared/SectionErrorState";
import type { ClassAnalysis } from "@/modules/import-data/types/holdings-analysis";
import {
  ChartSkeleton,
  DataPanel,
  Notice,
} from "@/modules/import-data/components/shared/ui";
import { CostCard } from "./analysis/CostCard";
import {
  EtfLookThroughCard,
  EtfTypeBreakdownCard,
} from "./analysis/EtfSections";
import {
  AllocationSections,
  AnalysedHoldingsCard,
} from "./analysis/HoldingsSections";
import {
  EquityFundamentals,
  MetricComparisonCard,
} from "./analysis/MetricComparison";
import { ScoresSection } from "./analysis/ScoresSection";
import {
  ConcentrationCard,
  MissingHoldingsNote,
  MoversCard,
} from "./analysis/SnapshotSections";

const FUNDS_NOTE =
  "Each fund's own published record, weighted by what you hold today and set against the same blend of their SEBI-category averages. Not your return — it does not know when you started holding it.";

/**
 * One class's analysis, composed in finsharpe-mobile's order
 * (`class_analytics_screen.dart`): what left the analysis out, today's movers,
 * scores, allocation, what the book is made of and costs (ETF), its quality or
 * the funds' record, concentration, the analysed holdings, then cost.
 */
function Sections({ a }: { a: ClassAnalysis }) {
  const s = a.snapshot;
  const etf = a.etf;
  const isEtf = a.kind === "etf";

  if (etf?.nothingAnalysed) {
    return (
      <MissingHoldingsNote
        missing={a.missing}
        isEtf
      />
    );
  }

  return (
    <>
      <MissingHoldingsNote
        missing={a.missing}
        isEtf={isEtf}
      />
      <MoversCard moves={s.holding_moves ?? []} />
      <ScoresSection
        kind={a.kind}
        profile={s.score_profile ?? []}
        primaryScore={a.primaryScore}
        riskScore={a.riskScore}
      />
      <AllocationSections
        industry={a.industry}
        categories={a.categories}
        size={a.size}
      />
      {etf?.typeBreakdown && (
        <EtfTypeBreakdownCard
          breakdown={etf.typeBreakdown}
          bookValue={etf.bookValue}
        />
      )}
      {isEtf && (
        <CostCard
          cost={a.cost}
          basisValue={a.cost?.portfolio_value ?? null}
        />
      )}
      {etf?.trackRecord ? (
        <MetricComparisonCard
          title="The ETFs you hold"
          metrics={etf.trackRecord.metrics}
          peerNoun="Category"
          note="Each ETF's own published record, weighted by what you hold today. Not your return — it does not know when you started holding it."
        />
      ) : a.kind === "mutualFunds" ? (
        <MetricComparisonCard
          title="The funds you hold"
          metrics={s.fundamentals ?? []}
          peerNoun="Category"
          note={FUNDS_NOTE}
        />
      ) : a.kind === "equities" ? (
        <EquityFundamentals metrics={s.fundamentals ?? []} />
      ) : null}
      {etf?.lookThrough && (
        <EtfLookThroughCard
          look={etf.lookThrough}
          bookValue={etf.bookValue}
        />
      )}
      {s.concentration && <ConcentrationCard c={s.concentration} />}
      <AnalysedHoldingsCard
        holdings={a.holdings}
        moves={s.holding_moves ?? []}
      />
      {!isEtf && <CostCard cost={a.cost} />}
    </>
  );
}

/**
 * The analysis states: running (skeletons in the dashboard's shape), failed
 * (says so, with a retry — never an empty dashboard), nothing to analyse, or
 * the sections. An edit that re-runs it keeps the last answer on screen.
 */
export function ClassAnalysisView({
  analysis,
  isLoading,
  isRefreshing,
  isError,
  errorStatus,
  isEmpty,
  onRetry,
}: {
  analysis: ClassAnalysis | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  errorStatus?: number;
  isEmpty: boolean;
  onRetry: () => void;
}) {
  if (isEmpty) {
    return (
      <Notice tone="info">
        Give at least one holding a quantity above zero to analyse it.
      </Notice>
    );
  }
  if (isError && !analysis) {
    const refused = errorStatus !== undefined && errorStatus < 500;
    return (
      <div className="glass-card rounded-card">
        <SectionErrorState
          title="Couldn't build the analysis"
          description={
            refused
              ? "The analysis service couldn't read these holdings. Check the quantities below and try again."
              : "The analysis service didn't respond. Your holdings are fine — try again in a moment."
          }
          onRetry={onRetry}
        />
      </div>
    );
  }
  if (isLoading || !analysis) {
    return (
      <>
        <DataPanel bodyClassName="flex items-center gap-3">
          <Loader2
            size={16}
            className="shrink-0 animate-spin text-[#063BAA] motion-reduce:animate-none dark:text-[#8FB4FF]"
          />
          <div className="text-[11px]">
            <p className="text-forest-deep font-medium dark:text-white">
              Analysing your holdings…
            </p>
            <p className="text-[10px] text-slate-400">
              Scores, allocation and concentration. This can take up to half a
              minute.
            </p>
          </div>
        </DataPanel>
        <ChartSkeleton height={150} />
        <ChartSkeleton height={120} />
      </>
    );
  }
  return (
    <>
      {isError && (
        <SectionErrorState
          compact
          title="Couldn't update the analysis for your edits — showing the last result"
          onRetry={onRetry}
        />
      )}
      {isRefreshing && (
        <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <Loader2
            size={11}
            className="animate-spin motion-reduce:animate-none"
          />
          Updating for your edits…
        </p>
      )}
      <Sections a={analysis} />
    </>
  );
}
