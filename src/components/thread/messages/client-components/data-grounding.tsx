"use client";
import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleDashed,
  Database,
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

const BAND_DISPLAY: Record<GroundingBand, { label: string; dot: string }> = {
  high: { label: "Well grounded", dot: "bg-green-500" },
  moderate: { label: "Partly grounded", dot: "bg-amber-500" },
  low: { label: "Weakly grounded", dot: "bg-orange-500" },
  ungrounded: { label: "Not grounded in live data", dot: "bg-red-500" },
};

function SourceStatusIcon({ source }: { source: SourceUsage }) {
  if (source.failed > 0) {
    return (
      <AlertTriangle
        className={cn(
          "size-3.5 flex-shrink-0",
          source.succeeded > 0 ? "text-amber-600" : "text-red-600",
        )}
      />
    );
  }
  if (source.empty > 0 && source.succeeded === 0) {
    return <CircleDashed className="size-3.5 flex-shrink-0 text-amber-600" />;
  }
  return <Check className="size-3.5 flex-shrink-0 text-green-600" />;
}

function sourceDetail(source: SourceUsage): string {
  const parts = [`${source.calls} ${source.calls === 1 ? "call" : "calls"}`];
  if (source.failed > 0) parts.push(`${source.failed} failed`);
  if (source.empty > 0) parts.push(`${source.empty} returned no data`);
  return parts.join(" · ");
}

export default function DataGrounding({
  sources,
  total_calls = 0,
  total_succeeded = 0,
  band,
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
  const display = judged ? BAND_DISPLAY[band as GroundingBand] : null;

  // Pre-judge (or judge-less) receipt summary; judged summary leads with
  // the claim check when one happened.
  const allOk = total_succeeded === total_calls;
  const receiptSummary = allOk
    ? `${total_calls} ${total_calls === 1 ? "retrieval" : "retrievals"} · ${sources?.length ?? 0} ${sources?.length === 1 ? "source" : "sources"}`
    : `${total_succeeded}/${total_calls} retrievals succeeded`;
  const judgedSummary =
    claims_checkable > 0
      ? `${claims_verified + claims_derived}/${claims_checkable} claims traced to data`
      : receiptSummary;

  return (
    <div className="mt-2 max-w-md">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors",
          "hover:bg-muted/50 hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "size-1.5 flex-shrink-0 rounded-full",
            display ? display.dot : allOk ? "bg-green-500" : "bg-amber-500",
          )}
        />
        <Database className="size-3.5 flex-shrink-0" />
        <span className="font-medium">
          {display ? display.label : "Data sources used"}
        </span>
        <span>— {judged ? judgedSummary : receiptSummary}</span>
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      {isExpanded && (
        <div className="mt-1 rounded-lg border bg-muted/30 p-3">
          {explanation && (
            <p
              className={cn(
                "mb-2 text-xs",
                band === "ungrounded" ? "text-red-700" : "text-muted-foreground",
              )}
            >
              {explanation}
            </p>
          )}

          {judged && claims_checkable > 0 && (
            <div className="mb-2">
              <p className="mb-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                Grounding check
              </p>
              <p className="text-xs text-muted-foreground">
                {claims_verified} verified
                {claims_derived > 0 && <> · {claims_derived} derived from source data</>}
                {claims_unverified > 0 && <> · {claims_unverified} unverified</>}
                {claims_advice > 0 && <> · {claims_advice} advice (not data-verifiable)</>}
              </p>
              {!!unverified_claims?.length && (
                <ul className="mt-1 space-y-0.5">
                  {unverified_claims.map((text, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-[11px] text-amber-700"
                    >
                      <AlertTriangle className="mt-0.5 size-3 flex-shrink-0" />
                      <span>“{text}”</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {hasSources && (
            <div>
              <p className="mb-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                Data sources used
              </p>
              <div className="space-y-2">
                {sources!.map((source) => (
                  <div key={source.server} className="flex items-start gap-2">
                    <div className="mt-0.5">
                      <SourceStatusIcon source={source} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-medium text-foreground">
                          {source.label}
                        </span>
                        <span className="flex-shrink-0 text-[11px] text-muted-foreground">
                          {sourceDetail(source)}
                        </span>
                      </div>
                      {source.tools && source.tools.length > 0 && (
                        <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground/70">
                          {source.tools.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="mt-2 border-t pt-2 text-[10px] text-muted-foreground/70">
            {judged
              ? "Checked against the live data retrieved for this response. Grounding measures whether figures trace to retrieved data — not the quality of the underlying analysis."
              : "Compiled from the live data retrievals behind this response."}
          </p>
        </div>
      )}
    </div>
  );
}
