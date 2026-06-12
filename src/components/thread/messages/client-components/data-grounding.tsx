"use client";
import { useState } from "react";
import { AlertTriangle, Check, ChevronDown, CircleDashed, Database } from "lucide-react";
import { cn } from "@/lib/utils";

// Mirrors middleware/data_grounding.py (DataGroundingReport v1) in
// finsharpe-agents: a deterministic receipt of the MCP tool activity behind
// one response. Evidence-only — no confidence wording until the grounding
// judge ships (increment 2).
type SourceUsage = {
  server: string;
  label: string;
  calls: number;
  succeeded: number;
  failed: number;
  empty: number;
  tools?: string[];
};

type Props = {
  version?: number;
  sources?: SourceUsage[];
  total_calls?: number;
  total_succeeded?: number;
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
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  const allOk = total_succeeded === total_calls;
  const summary = allOk
    ? `${total_calls} ${total_calls === 1 ? "retrieval" : "retrievals"} · ${sources.length} ${sources.length === 1 ? "source" : "sources"}`
    : `${total_succeeded}/${total_calls} retrievals succeeded`;

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
            allOk ? "bg-green-500" : "bg-amber-500",
          )}
        />
        <Database className="size-3.5 flex-shrink-0" />
        <span className="font-medium">Data sources used</span>
        <span>— {summary}</span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", isExpanded && "rotate-180")}
        />
      </button>

      {isExpanded && (
        <div className="mt-1 rounded-lg border bg-muted/30 p-3">
          <div className="space-y-2">
            {sources.map((source) => (
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
          <p className="mt-2 border-t pt-2 text-[10px] text-muted-foreground/70">
            Compiled from the live data retrievals behind this response.
          </p>
        </div>
      )}
    </div>
  );
}
