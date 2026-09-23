"use client";
import { motion } from "framer-motion";
import type {
  AnalysisKind,
  ComparisonMetric,
} from "@/modules/import-data/types/holdings-analysis";
import {
  DataPanel,
  MeterRow,
  ScoreRing,
} from "@/modules/import-data/components/shared/ui";
import { coverageLabel } from "./format";

/** One component score: label, value, a 0–100 bar and a tick at the peer blend. */
function ScoreBar({ metric }: { metric: ComparisonMetric }) {
  const v = metric.portfolio;
  const peer = metric.industry;
  return (
    <div className="space-y-1 text-[10px]">
      <div className="text-forest-deep flex justify-between gap-2 font-medium dark:text-white">
        <span className="truncate">{metric.label}</span>
        <span className="shrink-0 tabular-nums">
          {v == null ? "—" : Math.round(v)}
        </span>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, v ?? 0))}%` }}
          transition={{ duration: 0.8 }}
          className="h-full rounded-full bg-[#063BAA] dark:bg-[#8FB4FF]"
        />
        {peer != null && (
          <span
            title={`Peer average ${Math.round(peer)}`}
            className="bg-forest-deep absolute -top-0.5 h-2.5 w-0.5 rounded-full dark:bg-white"
            style={{ left: `calc(${Math.max(0, Math.min(100, peer))}% - 1px)` }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * "FinSharpe portfolio score": the overall score as a ring beside the
 * component scores, each ticked at the weight-matched peer average
 * (`snapshot.score_profile`). Falls back to the two gauges for a backend with
 * no profile. ETFs are in no screener, so they get neither — the section is
 * absent rather than filled with a proxy.
 */
export function ScoresSection({
  kind,
  profile,
  primaryScore,
  riskScore,
}: {
  kind: AnalysisKind;
  profile: ComparisonMetric[];
  primaryScore: number | null;
  riskScore: number | null;
}) {
  if (kind === "etf") return null;
  const peerNoun = kind === "equities" ? "industry" : "category";

  if (profile.length > 0) {
    const overall = profile.find((m) => m.key === "overall");
    const bars = profile.filter((m) => m !== overall);
    const ticked = profile.some((m) => m.industry != null);
    return (
      <DataPanel
        title="FinSharpe portfolio score"
        bodyClassName="space-y-3"
      >
        <div className="flex items-center gap-5">
          {overall?.portfolio != null && (
            <div className="flex flex-col items-center gap-1">
              <ScoreRing value={overall.portfolio} />
              <span className="text-[9.5px] text-slate-400">
                {overall.industry != null
                  ? `${peerNoun} avg ${Math.round(overall.industry)}`
                  : "Overall"}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-2.5">
            {bars.map((m) => (
              <ScoreBar
                key={m.key}
                metric={m}
              />
            ))}
          </div>
        </div>
        <p className="border-border-subtle border-t pt-2 text-[10px] leading-relaxed text-slate-400">
          Weighted across the current holdings.
          {ticked &&
            ` The tick on each bar is the same weighted blend of those holdings' ${peerNoun} averages.`}{" "}
          Higher is better on every score except Risk.
        </p>
        {overall && overall.coverage_pct < 99.5 && (
          <p className="text-[10px] text-amber-600">
            Scored over {coverageLabel(overall.coverage_pct)}% of portfolio
            weight.
          </p>
        )}
      </DataPanel>
    );
  }

  if (primaryScore === null && riskScore === null) return null;
  const scoreLabel =
    kind === "equities" ? "FinSharpe Score" : "Performance Score";
  return (
    <DataPanel
      title="Scores"
      bodyClassName="flex items-center gap-5"
    >
      <ScoreRing value={primaryScore} />
      <div className="flex-1 space-y-2.5 text-[10px]">
        <MeterRow
          label={scoreLabel}
          valueLabel={
            primaryScore === null ? "—" : String(Math.round(primaryScore))
          }
          pct={primaryScore ?? 0}
          barClass="bg-[#063BAA] dark:bg-[#8FB4FF]"
        />
        <MeterRow
          label="Risk Score"
          valueLabel={
            riskScore === null
              ? "—"
              : `${Math.round(riskScore)} · ${riskScore < 30 ? "Low" : riskScore <= 60 ? "Moderate" : "High"}`
          }
          pct={riskScore ?? 0}
          barClass="bg-slate-400 dark:bg-slate-500"
        />
      </div>
    </DataPanel>
  );
}
