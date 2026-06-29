"use client";
import { Loader2, Repeat, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EmptyState,
  formatINRCompact,
} from "./shared/ui";
import { formatLastUpdated } from "../utils/date-formatting";
import {
  useNetworthData,
  type NetworthClass,
  type NetworthData,
} from "../hooks/useNetworthData";

/** Diagonal hatch used for a still-syncing slice / dot — neutral in both modes. */
const PENDING_STRIPES =
  "repeating-linear-gradient(45deg, rgba(120,120,120,0.22) 0 5px, transparent 5px 10px)";

/**
 * "My Networth" — live net worth aggregated across every connected MoneyOne
 * consent (Equities + Mutual Funds + ETF + Cash). A single stacked allocation
 * bar plus a ledger breakdown, in the Calm-Ledger language. Replaces the old
 * hardcoded placeholder; SIP is shown only as a registration count, never summed.
 */
export function NetworthGraph() {
  const nw = useNetworthData();

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="text-success-fg h-5 w-5" />
        <h3 className="text-text-primary font-medium">My Networth</h3>
        {nw.sipCount > 0 && (
          <span className="border-info-border bg-info-icon-bg text-info-icon ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
            <Repeat className="h-3 w-3" />
            {nw.sipCount} SIP registration{nw.sipCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="border-border bg-card rounded-2xl border p-5 shadow-sm md:p-6">
        {nw.isInitialLoading ? (
          <NetworthSkeleton />
        ) : nw.isEmpty ? (
          <EmptyState
            icon={TrendingUp}
            intent="positive"
            title="Connect an account to see your net worth"
            description="Link a demat, mutual fund or bank account above and your live net worth — with a full asset-allocation breakdown — appears here."
          />
        ) : (
          <NetworthSummary nw={nw} />
        )}
      </div>
    </section>
  );
}

function NetworthSummary({ nw }: { nw: NetworthData }) {
  const syncing = nw.syncingCount > 0;
  const valued = nw.classes.filter((c) => c.value != null && c.value > 0);
  const syncingLabels = nw.classes
    .filter((c) => c.status === "syncing")
    .map((c) => c.label);

  return (
    <div>
      {/* Headline */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-text-tertiary text-[11px] font-semibold tracking-[0.08em] uppercase">
            Total net worth
            {syncing && (
              <span className="text-text-muted normal-case">
                {" · "}
                {nw.readyCount} of {nw.connectedCount} synced
              </span>
            )}
          </p>
          <p className="text-text-primary mt-1.5 text-3xl leading-none font-semibold tracking-tight tabular-nums md:text-[34px]">
            {formatINRCompact(nw.total)}
          </p>
        </div>
        <AsOfPill syncing={syncing} latest={nw.latestUpdate} />
      </div>

      {/* Allocation bar */}
      <div className="mt-6">
        <div
          className="bg-muted flex h-3.5 gap-[3px] overflow-hidden rounded-lg"
          role="img"
          aria-label={`Asset allocation: ${nw.classes
            .map(
              (c) =>
                `${c.label} ${
                  c.value == null ? "syncing" : formatINRCompact(c.value)
                }`,
            )
            .join(", ")}`}
        >
          {valued.map((c) => (
            <div
              key={c.key}
              className="h-full rounded-[3px] first:rounded-l-lg last:rounded-r-lg"
              style={{ flexGrow: c.value ?? 0, flexBasis: 0, background: c.color }}
              title={`${c.label} · ${formatINRCompact(c.value)} · ${Math.round(c.pct)}%`}
            />
          ))}
          {syncing && (
            <div
              className="h-full rounded-[3px] last:rounded-r-lg"
              style={{
                flexGrow: Math.max(nw.total * 0.18, 1),
                flexBasis: 0,
                backgroundImage: PENDING_STRIPES,
              }}
              title="Syncing…"
            />
          )}
        </div>
      </div>

      {/* Ledger breakdown */}
      <div className="border-border-subtle mt-6 flex flex-wrap gap-x-6 gap-y-5 border-t pt-5">
        {nw.classes.map((c) => (
          <ClassTile key={c.key} c={c} />
        ))}
      </div>

      {/* Syncing hint */}
      {syncing && (
        <div className="border-warning-border bg-warning-bg text-warning-fg mt-5 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
          <span>
            Syncing {syncingLabels.join(", ")} — the total updates automatically
            when it’s ready.
          </span>
        </div>
      )}
    </div>
  );
}

function ClassTile({ c }: { c: NetworthClass }) {
  const isSyncing = c.status === "syncing";
  return (
    <div className="flex min-w-[120px] flex-1 flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
          style={
            isSyncing
              ? { backgroundImage: PENDING_STRIPES, backgroundColor: "var(--muted)" }
              : { background: c.color }
          }
        />
        <span className="text-text-tertiary text-[11px] font-semibold tracking-[0.05em] uppercase">
          {c.label}
        </span>
      </div>
      {isSyncing ? (
        <>
          <span className="bg-muted h-[18px] w-16 animate-pulse rounded motion-reduce:animate-none" />
          <span className="text-text-tertiary text-xs">syncing…</span>
        </>
      ) : (
        <>
          <span className="text-text-primary text-lg leading-none font-semibold tabular-nums md:text-xl">
            {formatINRCompact(c.value)}
          </span>
          <span className="text-text-tertiary text-xs">
            {Math.round(c.pct)}% · {c.unitLabel}
          </span>
        </>
      )}
    </div>
  );
}

function AsOfPill({
  syncing,
  latest,
}: {
  syncing: boolean;
  latest?: string;
}) {
  const label = syncing
    ? "Updating…"
    : latest
      ? `Updated ${formatLastUpdated(latest)}`
      : "Synced";
  return (
    <span className="border-border bg-bg-subtle text-text-tertiary inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          syncing
            ? "bg-warning-fg animate-pulse motion-reduce:animate-none"
            : "bg-success-fg",
        )}
      />
      {label}
    </span>
  );
}

function NetworthSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="bg-muted block h-3 w-28 animate-pulse rounded motion-reduce:animate-none" />
        <span className="bg-muted block h-8 w-40 animate-pulse rounded motion-reduce:animate-none" />
      </div>
      <span className="bg-muted block h-3.5 w-full animate-pulse rounded-lg motion-reduce:animate-none" />
      <div className="flex flex-wrap gap-6 pt-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="bg-muted h-12 min-w-[120px] flex-1 animate-pulse rounded motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}
