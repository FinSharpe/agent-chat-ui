"use client";
import type {
  Concentration,
  HoldingDayMove,
  MissingHolding,
} from "@/modules/import-data/types/holdings-analysis";
import { cn } from "@/lib/utils";
import { DataPanel, Notice } from "@/modules/import-data/components/shared/ui";
import { signedPct } from "./format";

const UP = "text-[#0A9E6E]";
const DOWN = "text-rose-500";

/**
 * Who moved the book today: each holding's weight × its own move, diverging
 * from a shared zero — the leaders and the laggards, like mobile's
 * `ContributionCard`. Contributions sum to the Today tile's figure.
 */
export function MoversCard({
  moves,
  maxRows = 5,
  addon,
  note,
}: {
  moves: HoldingDayMove[];
  maxRows?: number;
  /** Right of the title — the session's date. */
  addon?: string;
  note?: string;
}) {
  if (moves.length === 0) return null;
  const leaders = moves.slice(0, maxRows);
  const laggards = moves.slice(-maxRows).filter((m) => !leaders.includes(m));
  const shown = [...leaders, ...laggards];
  const scale = Math.max(...shown.map((m) => Math.abs(m.contribution_pct)), 0);

  return (
    <DataPanel
      title="Today's movers"
      addon={addon}
      bodyClassName="space-y-2"
    >
      {shown.map((m, i) => {
        const up = m.contribution_pct >= 0;
        const frac = scale > 0 ? Math.abs(m.contribution_pct) / scale : 0;
        return (
          <div key={`${m.ticker}-${i}`}>
            {i === leaders.length && laggards.length > 0 && (
              <div className="border-border-subtle mb-2 border-t" />
            )}
            <div className="flex items-center gap-2 text-[11px]">
              <div className="min-w-0 flex-[5]">
                <p className="text-forest-deep truncate font-medium dark:text-white">
                  {m.company_name || m.ticker}
                </p>
                <p className="text-[9.5px] text-slate-400 tabular-nums">
                  {m.weight_pct.toFixed(1)}% weight
                </p>
              </div>
              <span
                className={cn(
                  "w-14 shrink-0 text-right text-[10px] tabular-nums",
                  up ? UP : DOWN,
                )}
              >
                {signedPct(m.day_pct)}
              </span>
              <div className="relative h-2 flex-[4]">
                <span className="absolute inset-y-0 left-1/2 w-px bg-slate-200 dark:bg-slate-700" />
                <span
                  className={cn(
                    "absolute inset-y-px rounded-sm",
                    up ? "left-1/2 bg-[#0A9E6E]" : "right-1/2 bg-rose-500",
                  )}
                  style={{ width: `max(${frac * 50}%, 2px)` }}
                />
              </div>
            </div>
          </div>
        );
      })}
      {moves.length > shown.length && (
        <p className="pt-1 text-[10px] text-slate-400">
          {moves.length - shown.length} other holdings moved the portfolio less
        </p>
      )}
      {note && (
        <p className="pt-1 text-[10px] leading-relaxed text-slate-400">
          {note}
        </p>
      )}
    </DataPanel>
  );
}

/** How concentrated the book is — arithmetic on today's weights alone. */
export function ConcentrationCard({ c }: { c: Concentration }) {
  const figures = [
    { label: "Top 5 weight", value: `${c.top_5_weight_pct.toFixed(1)}%` },
    { label: "Top 10 weight", value: `${c.top_10_weight_pct.toFixed(1)}%` },
    { label: "Largest holding", value: `${c.max_weight_pct.toFixed(1)}%` },
    {
      label: "Effective holdings",
      value: c.effective_holdings.toFixed(1),
      hint: `of ${c.holdings}`,
    },
  ];
  return (
    <DataPanel
      title="Concentration"
      bodyClassName="space-y-3"
    >
      <div className="divide-border-subtle grid grid-cols-2 gap-y-3 sm:grid-cols-4 sm:divide-x">
        {figures.map((f) => (
          <div
            key={f.label}
            className="space-y-0.5 sm:px-3 sm:first:pl-0"
          >
            <p className="text-[10px] text-slate-400">{f.label}</p>
            <p className="text-forest-deep text-sm font-medium tabular-nums dark:text-white">
              {f.value}
              {f.hint && (
                <span className="ml-1 text-[10px] font-normal text-slate-400">
                  {f.hint}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
      <p className="text-[10px] leading-relaxed text-slate-400">
        Effective holdings is 1/HHI: the equal-weighted portfolio this one is as
        concentrated as. It equals the holdings count only when every weight is
        identical.
      </p>
    </DataPanel>
  );
}

const ETF_REASON: Record<string, string> = {
  no_scheme_match: "couldn't be matched to a scheme",
  not_an_etf: "turned out not to be an ETF",
  missing_in_closing: "had no recent price",
  etf_flag_unreadable: "couldn't be confirmed as an ETF",
};

/** What the analysis left out, and what that costs the figures below. */
export function MissingHoldingsNote({
  missing,
  isEtf,
}: {
  missing: MissingHolding[];
  isEtf: boolean;
}) {
  if (missing.length === 0) return null;
  const label = (n: number) => `${n} holding${n === 1 ? "" : "s"}`;
  const names = (list: MissingHolding[]) =>
    list.map((m) => m.name || m.id).join(", ");

  let lines: string[];
  if (isEtf) {
    const byReason = new Map<string, MissingHolding[]>();
    missing.forEach((m) =>
      byReason.set(m.reason, [...(byReason.get(m.reason) ?? []), m]),
    );
    lines = [...byReason].map(
      ([reason, list]) =>
        `${label(list.length)} ${ETF_REASON[reason] ?? "couldn't be included"} (${names(list)}) — left out of the cost and the track record, still counted in Value.`,
    );
  } else {
    const dropped = missing.filter(
      (m) =>
        m.reason === "missing_in_closing" || m.reason === "missing_in_both",
    );
    const unscored = missing.filter((m) => !dropped.includes(m));
    lines = [
      ...(dropped.length
        ? [
            `Couldn't match ${label(dropped.length)} (${names(dropped)}) to market data — excluded from all analytics.`,
          ]
        : []),
      ...(unscored.length
        ? [
            `No screener data for ${label(unscored.length)} (${names(unscored)}) — left out of the scores and the quality breakdowns.`,
          ]
        : []),
    ];
  }
  return (
    <Notice tone="warning">
      {lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
    </Notice>
  );
}
