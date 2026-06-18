"use client";
import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleDashed,
  Database,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  type LucideIcon,
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

// The verdict drives every accent on the card. `level` (1–4) positions the
// band on the strength meter; the color classes all resolve to theme tokens
// so the readout stays legible in light and dark mode.
type BandStyle = {
  label: string;
  eyebrow: string;
  level: number;
  icon: LucideIcon;
  text: string;
  tile: string;
  ring: string;
  spine: string;
  fill: string;
};

const BAND_STYLE: Record<GroundingBand, BandStyle> = {
  high: {
    label: "Well grounded",
    eyebrow: "Grounding · strong",
    level: 4,
    icon: ShieldCheck,
    text: "text-success-fg",
    tile: "bg-success-bg",
    ring: "ring-success-border",
    spine: "bg-success-fg",
    fill: "bg-success-fg",
  },
  moderate: {
    label: "Partly grounded",
    eyebrow: "Grounding · moderate",
    level: 3,
    icon: Shield,
    text: "text-warning-fg",
    tile: "bg-warning-bg",
    ring: "ring-warning-border",
    spine: "bg-warning-fg",
    fill: "bg-warning-fg",
  },
  low: {
    label: "Weakly grounded",
    eyebrow: "Grounding · weak",
    level: 2,
    icon: ShieldAlert,
    text: "text-accent-orange",
    tile: "bg-accent-orange-bg",
    ring: "ring-accent-orange-border",
    spine: "bg-accent-orange",
    fill: "bg-accent-orange",
  },
  ungrounded: {
    label: "Not grounded in live data",
    eyebrow: "Grounding · none",
    level: 1,
    icon: ShieldOff,
    text: "text-error-fg",
    tile: "bg-error-bg",
    ring: "ring-error-border",
    spine: "bg-error-fg",
    fill: "bg-error-fg",
  },
};

// Signature element: a signal-bar strength meter. Rungs fill up to the
// band's level, reading as "how strong is the trace to live data".
function StrengthMeter({
  level,
  fill,
  className,
}: {
  level: number;
  fill: string;
  className?: string;
}) {
  const heights = ["h-1.5", "h-2", "h-2.5", "h-3"];
  return (
    <div
      className={cn("flex items-end gap-[3px]", className)}
      aria-hidden="true"
    >
      {[1, 2, 3, 4].map((rung, i) => (
        <span
          key={rung}
          className={cn(
            "w-[3px] rounded-full transition-colors",
            heights[i],
            rung <= level ? fill : "bg-border",
          )}
        />
      ))}
    </div>
  );
}

function SourceStatusIcon({ source }: { source: SourceUsage }) {
  if (source.failed > 0) {
    return (
      <AlertTriangle
        className={cn(
          "size-3.5 flex-shrink-0",
          source.succeeded > 0 ? "text-warning-fg" : "text-error-fg",
        )}
      />
    );
  }
  if (source.empty > 0 && source.succeeded === 0) {
    return <CircleDashed className="size-3.5 flex-shrink-0 text-warning-fg" />;
  }
  return <Check className="size-3.5 flex-shrink-0 text-success-fg" />;
}

function sourceDetail(source: SourceUsage): string {
  const parts = [`${source.calls} ${source.calls === 1 ? "call" : "calls"}`];
  if (source.failed > 0) parts.push(`${source.failed} failed`);
  if (source.empty > 0) parts.push(`${source.empty} returned no data`);
  return parts.join(" · ");
}

// One hairline-divided cell in the claim-check tally.
function ClaimTile({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 bg-card px-3 py-2">
      <span className={cn("text-lg leading-none font-semibold tabular-nums", accent)}>
        {value}
      </span>
      <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  );
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
  const style = judged ? BAND_STYLE[band as GroundingBand] : null;

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

  const HeaderIcon = style ? style.icon : Database;
  const showClaimCheck = judged && claims_checkable > 0;

  return (
    <div
      className={cn(
        "group/dg relative mt-3 w-full overflow-hidden rounded-xl border bg-card shadow-sm",
        "transition-shadow hover:shadow-md",
      )}
    >
      {/* Ledger spine — the verdict colors the full height of the card. */}
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          style ? style.spine : allOk ? "bg-primary" : "bg-warning-fg",
        )}
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        className={cn(
          "flex w-full items-center gap-3 py-2.5 pr-3 pl-4 text-left",
          "transition-colors hover:bg-muted/40",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset",
        )}
      >
        <span
          className={cn(
            "grid size-9 flex-shrink-0 place-items-center rounded-lg ring-1 ring-inset",
            style ? cn(style.tile, style.ring, style.text) : "bg-accent ring-border text-muted-foreground",
          )}
        >
          <HeaderIcon className="size-[18px]" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/80 uppercase">
              {style ? style.eyebrow : "Data trace"}
            </span>
            {judged && style && (
              <StrengthMeter level={style.level} fill={style.fill} />
            )}
          </span>
          <span className="mt-0.5 flex items-baseline gap-2">
            <span
              className={cn(
                "truncate text-sm font-semibold",
                style ? style.text : "text-foreground",
              )}
            >
              {style ? style.label : "Data sources used"}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground tabular-nums">
            {judged ? judgedSummary : receiptSummary}
          </span>
        </span>

        <ChevronDown
          className={cn(
            "size-4 flex-shrink-0 text-muted-foreground transition-transform duration-300 motion-reduce:transition-none",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      {/* Smooth height animation via grid-template-rows; honors reduced motion. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t px-4 py-3 pl-4">
            {explanation && (
              <p
                className={cn(
                  "text-xs leading-relaxed",
                  band === "ungrounded" ? "text-error-fg" : "text-muted-foreground",
                )}
              >
                {explanation}
              </p>
            )}

            {showClaimCheck && (
              <section>
                <p className="mb-1.5 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Claim check
                </p>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-4">
                  <ClaimTile
                    value={claims_verified}
                    label="Verified"
                    accent="text-success-fg"
                  />
                  <ClaimTile
                    value={claims_derived}
                    label="Derived"
                    accent="text-accent-blue"
                  />
                  <ClaimTile
                    value={claims_unverified}
                    label="Unverified"
                    accent={claims_unverified > 0 ? "text-warning-fg" : "text-foreground"}
                  />
                  <ClaimTile
                    value={claims_advice}
                    label="Advice"
                    accent="text-muted-foreground"
                  />
                </div>
                {!!unverified_claims?.length && (
                  <ul className="mt-2 space-y-1">
                    {unverified_claims.map((text, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 rounded-md bg-warning-bg/60 px-2 py-1 text-[11px] text-warning-fg"
                      >
                        <AlertTriangle className="mt-0.5 size-3 flex-shrink-0" />
                        <span className="leading-snug">“{text}”</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {hasSources && (
              <section>
                <p className="mb-1.5 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Data sources
                </p>
                <div className="divide-y divide-border overflow-hidden rounded-lg border">
                  {sources!.map((source) => (
                    <div
                      key={source.server}
                      className="flex items-start gap-2.5 px-3 py-2"
                    >
                      <div className="mt-0.5">
                        <SourceStatusIcon source={source} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-xs font-medium text-foreground">
                            {source.label}
                          </span>
                          <span className="flex-shrink-0 text-[11px] text-muted-foreground tabular-nums">
                            {sourceDetail(source)}
                          </span>
                        </div>
                        {source.tools && source.tools.length > 0 && (
                          <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground/70">
                            {source.tools.join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <p className="border-t pt-2.5 text-[10px] leading-relaxed text-muted-foreground/70">
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
