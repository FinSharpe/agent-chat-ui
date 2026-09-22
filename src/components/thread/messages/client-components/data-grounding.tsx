"use client";
import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Info,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mirrors middleware/data_grounding.py (DataGroundingReport v2) in
// finsharpe-agents. Two-phase: the evidence receipt arrives first
// (band null), then the grounding-judge verdict replaces it in place
// (same UI message id). Bands speak about *grounding* — how well the
// response traces to retrieved data — never "confidence".
type SourceUsage = {
  server: string;
  label: string;
  calls: number;
  succeeded: number;
  failed: number;
  empty: number;
  tools?: string[];
};

type GroundingBand = "high" | "moderate" | "low" | "ungrounded";

type Props = {
  version?: number;
  sources?: SourceUsage[];
  total_calls?: number;
  total_succeeded?: number;
  band?: GroundingBand | null;
  score?: number | null;
  claims_total?: number;
  claims_checkable?: number;
  claims_verified?: number;
  claims_derived?: number;
  claims_unverified?: number;
  claims_advice?: number;
  unverified_claims?: string[];
  verification_partial?: boolean;
  explanation?: string | null;
};

// Tone pairs from the reference's confidence pills: mint for a strong trace,
// amber for a partial one, rose where the answer outruns its data.
const TONE = {
  mint: "bg-[#97edcc]/25 text-[#0A9E6E]",
  amber: "bg-amber-500/10 text-amber-600",
  rose: "bg-rose-500/10 text-rose-600",
  blue: "bg-[#063BAA]/8 text-[#063BAA]",
} as const;

const BAND: Record<GroundingBand, { label: string; tone: string }> = {
  high: { label: "Well grounded", tone: TONE.mint },
  moderate: { label: "Partly grounded", tone: TONE.amber },
  low: { label: "Weakly grounded", tone: TONE.rose },
  ungrounded: { label: "Not grounded in live data", tone: TONE.rose },
};

// One source's state, read off its real call counts.
function sourceStatus(source: SourceUsage): { label: string; tone: string } {
  if (source.failed > 0) {
    return source.succeeded > 0
      ? { label: "Partial", tone: TONE.amber }
      : { label: "Failed", tone: TONE.rose };
  }
  if (source.empty > 0 && source.succeeded === 0) {
    return { label: "No data", tone: TONE.amber };
  }
  return { label: "Retrieved", tone: TONE.mint };
}

function sourceDetail(source: SourceUsage): string {
  const parts = [`${source.calls} ${source.calls === 1 ? "call" : "calls"}`];
  if (source.failed > 0) parts.push(`${source.failed} failed`);
  if (source.empty > 0) parts.push(`${source.empty} empty`);
  return parts.join(" · ");
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] font-medium tracking-wider text-slate-400 uppercase">
      {children}
    </span>
  );
}

// One cell of the claim-check tally.
function ClaimTile({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: string;
}) {
  return (
    <div className="glass-tile rounded-nested px-3 py-2.5">
      <p className="text-[9px] text-slate-400">{label}</p>
      <p
        className={cn(
          "font-geist mt-1 text-sm font-medium text-[#0A1F4D] tabular-nums",
          accent,
        )}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * The per-answer grounding report, drawn as the reference's "Sources &
 * Reliability" card. The header and score stay visible so every answer
 * carries its verdict; the claim tally and per-source detail fold away.
 */
export default function DataGrounding({
  sources,
  total_calls = 0,
  total_succeeded = 0,
  band,
  score,
  claims_checkable = 0,
  claims_verified = 0,
  claims_derived = 0,
  claims_unverified = 0,
  claims_advice = 0,
  unverified_claims,
  explanation,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasSources = !!sources && sources.length > 0;
  if (!hasSources && !band) return null;

  const judged = !!band;
  const verdict = judged ? BAND[band as GroundingBand] : null;

  const allOk = total_succeeded === total_calls;

  // Pre-judge (or judge-less) receipt summary; the judged summary leads with
  // the claim check when one happened.
  const receiptSummary = allOk
    ? `${total_calls} ${total_calls === 1 ? "retrieval" : "retrievals"} · ${sources?.length ?? 0} ${sources?.length === 1 ? "source" : "sources"}`
    : `${total_succeeded}/${total_calls} retrievals succeeded`;
  const judgedSummary =
    claims_checkable > 0
      ? `${claims_verified + claims_derived}/${claims_checkable} claims traced to data`
      : receiptSummary;
  const summary = judged ? judgedSummary : receiptSummary;

  const percent =
    judged && score != null
      ? Math.round(Math.min(Math.max(score, 0), 1) * 100)
      : null;
  const showClaimCheck = judged && claims_checkable > 0;

  return (
    <div className="glass-card rounded-card mt-3 w-full overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-3 px-5 pt-4 pb-3 text-left focus-visible:outline-none"
      >
        <span className="flex min-w-0 items-center gap-2">
          <ShieldCheck
            size={14}
            className="shrink-0 text-[#063BAA]"
          />
          <span className="font-geist truncate text-xs font-medium text-[#0A1F4D]">
            Sources &amp; Reliability
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              verdict ? verdict.tone : allOk ? TONE.blue : TONE.amber,
            )}
          >
            {verdict ? verdict.label : "Data trace"}
          </span>
          <ChevronDown
            size={14}
            className={cn(
              "text-slate-400 transition-transform duration-300 motion-reduce:transition-none",
              isExpanded && "rotate-180",
            )}
          />
        </span>
      </button>

      {/* Always visible: the score bar once the judge has scored the answer,
          otherwise the receipt line. */}
      <div className="space-y-1.5 px-5 pb-4">
        {percent != null ? (
          <>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Grounding score</span>
              <span className="font-medium text-[#0A1F4D] tabular-nums">
                {percent}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="bg-brand-gradient h-full rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 tabular-nums">{summary}</p>
          </>
        ) : (
          // A receipt may never be judged (judge off or failed), so it only
          // states what was retrieved rather than promising a verdict.
          <p className="text-[10px] text-slate-400 tabular-nums">{summary}</p>
        )}
      </div>

      {/* Smooth height animation via grid-template-rows; honors reduced motion. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-slate-50 px-5 pt-4 pb-5">
            {showClaimCheck && (
              <div className="space-y-2">
                <SectionLabel>Claim check</SectionLabel>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <ClaimTile
                    value={claims_verified}
                    label="Verified"
                    accent="text-[#0A9E6E]"
                  />
                  <ClaimTile
                    value={claims_derived}
                    label="Derived"
                    accent="text-[#063BAA]"
                  />
                  <ClaimTile
                    value={claims_unverified}
                    label="Unverified"
                    accent={
                      claims_unverified > 0 ? "text-amber-600" : undefined
                    }
                  />
                  <ClaimTile
                    value={claims_advice}
                    label="Advice"
                  />
                </div>
                {!!unverified_claims?.length && (
                  <ul className="space-y-1.5 pt-0.5">
                    {unverified_claims.map((text, i) => (
                      <li
                        key={i}
                        className="rounded-nested flex items-start gap-1.5 bg-amber-500/10 px-2.5 py-1.5 text-[10px] text-amber-600"
                      >
                        <AlertTriangle
                          size={11}
                          className="mt-0.5 shrink-0"
                        />
                        <span className="leading-snug">“{text}”</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {hasSources && (
              <div className="space-y-2">
                <SectionLabel>Data sources used</SectionLabel>
                <div className="space-y-2">
                  {sources!.map((source) => {
                    const status = sourceStatus(source);
                    return (
                      <div
                        key={source.server}
                        className="flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[10px] text-[#0A1F4D]">
                            {source.label}
                          </p>
                          {source.tools && source.tools.length > 0 && (
                            <p className="mt-0.5 truncate font-mono text-[9px] text-slate-400">
                              {source.tools.join(" · ")}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-[9px] text-slate-400 tabular-nums">
                            {sourceDetail(source)}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[9px] font-medium",
                              status.tone,
                            )}
                          >
                            {status.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {explanation && (
              <p
                className={cn(
                  "flex gap-1.5 text-[9.5px] leading-relaxed",
                  band === "ungrounded" ? "text-rose-600" : "text-slate-400",
                )}
              >
                <Info
                  size={11}
                  className="mt-0.5 shrink-0 text-slate-300"
                />
                {explanation}
              </p>
            )}

            <p className="border-t border-slate-50 pt-2 text-[9px] leading-relaxed text-slate-400/80">
              {judged
                ? "Checked against the live data retrieved for this response. Grounding measures whether figures trace to retrieved data — not the quality of the underlying analysis."
                : "Compiled from the live data retrievals behind this response."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
