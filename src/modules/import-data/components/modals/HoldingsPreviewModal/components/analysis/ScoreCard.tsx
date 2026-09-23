"use client";
import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import {
  Badge,
  DataPanel,
  MeterRow,
  ScoreRing,
} from "@/modules/import-data/components/shared/ui";
import { riskLabel, riskTone, scoreTone } from "./analysis-utils";

export type ScoreBadge = { text: ReactNode; tone?: "warn" | "ok" };

/** Small text action in a card header — re-runs the analysis. */
export function RerunLink({
  onClick,
  busy,
}: {
  onClick?: () => void;
  busy?: boolean;
}) {
  if (!onClick) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="flex items-center gap-1 text-[10px] font-medium text-[#063BAA] hover:underline disabled:opacity-50 dark:text-[#8FB4FF]"
    >
      <RefreshCw
        size={11}
        className={busy ? "animate-spin" : undefined}
      />
      Re-run
    </button>
  );
}

/**
 * The reference "FinSharpe Portfolio Score" card: a score ring beside labelled
 * meter bars, then a row of fact badges. Fed with the analytics API's real
 * score (FinSharpe for stocks, Performance for funds) and risk score.
 */
export function ScoreCard({
  title,
  scoreLabel,
  score,
  risk,
  badges,
  onRerun,
  isRerunning,
}: {
  title: string;
  scoreLabel: string;
  score: number | null;
  risk: number | null;
  badges: ScoreBadge[];
  onRerun?: () => void;
  isRerunning?: boolean;
}) {
  return (
    <DataPanel
      title={title}
      addon={
        <RerunLink
          onClick={onRerun}
          busy={isRerunning}
        />
      }
      bodyClassName="space-y-4"
    >
      <div className="flex items-center gap-5">
        <ScoreRing value={score} />
        <div className="flex-1 space-y-2.5 text-[10px]">
          <MeterRow
            label={scoreLabel}
            valueLabel={score === null ? "—" : String(Math.round(score))}
            pct={score ?? 0}
            barClass="bg-[#063BAA]"
          />
          <MeterRow
            label="Risk Score"
            valueLabel={
              risk === null ? "—" : `${Math.round(risk)} · ${riskLabel(risk)}`
            }
            pct={risk ?? 0}
            barClass={riskTone(risk).bar}
          />
          <p className="text-[9px] leading-relaxed text-slate-400">
            Scores run 0–100.{" "}
            <span className={scoreTone(score).text}>Higher is better</span> for{" "}
            {scoreLabel}; a <span className="text-[#0A9E6E]">lower</span> risk
            score is safer.
          </p>
        </div>
      </div>
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-slate-50 pt-2 dark:border-slate-800/50">
          {badges.map((b, i) => (
            <Badge
              key={i}
              tone={b.tone}
            >
              {b.text}
            </Badge>
          ))}
        </div>
      )}
    </DataPanel>
  );
}
