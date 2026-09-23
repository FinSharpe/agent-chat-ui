"use client";
import { ArrowRight } from "lucide-react";
import { formatINRShort } from "../utils/inr";
import { formatLastUpdated } from "../utils/date-formatting";
import {
  useNetworthData,
  type NetworthClass,
  type NetworthData,
} from "../hooks/useNetworthData";

/**
 * Allocation segments are white at decreasing strength — the card is the
 * brand gradient, so colour would fight it. Dots in the breakdown use the
 * same strengths, so the row doubles as the bar's legend.
 */
const SEGMENT_ALPHA = [1, 0.7, 0.46, 0.28];

/** Diagonal hatch for a class that is still syncing. */
const SYNCING_HATCH =
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.35) 0 4px, transparent 4px 8px)";

/**
 * "Total Portfolio Value" — the reference Import screen's net worth card,
 * driven by the live MoneyOne data aggregated in useNetworthData. There is no
 * value history to chart, so the reference's trend line becomes the asset
 * allocation bar, and "since last year" becomes the unrealised gain on the
 * accounts that report a cost basis.
 */
export function NetworthGraph({ onConnect }: { onConnect?: () => void }) {
  const nw = useNetworthData();

  return (
    <section className="space-y-3">
      <div className="bg-brand-gradient premium-shadow-sm card-hover relative space-y-4 overflow-hidden rounded-card p-6">
        {nw.isInitialLoading ? (
          <NetworthSkeleton />
        ) : nw.isEmpty ? (
          <NetworthEmpty onConnect={onConnect} />
        ) : (
          <NetworthSummary nw={nw} />
        )}
      </div>
    </section>
  );
}

function NetworthSummary({ nw }: { nw: NetworthData }) {
  const syncing = nw.syncingCount > 0;
  const gain = nw.invested > 0 ? nw.investedCurrent - nw.invested : null;
  const gainPct = gain != null ? (gain / nw.invested) * 100 : null;
  const sip =
    nw.sipCount > 0
      ? `${nw.sipCount} SIP${nw.sipCount === 1 ? "" : "s"}`
      : null;

  const subline = syncing
    ? `${nw.readyCount} of ${nw.connectedCount} account types synced`
    : gain != null
      ? `${gain >= 0 ? "+" : ""}${formatINRShort(gain)} unrealised ${gain >= 0 ? "gain" : "loss"}`
      : `Across ${nw.connectedCount} connected account type${nw.connectedCount === 1 ? "" : "s"}`;

  const pill = syncing
    ? "Updating…"
    : gainPct != null
      ? `${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(1)}% returns`
      : nw.latestUpdate
        ? `Updated ${formatLastUpdated(nw.latestUpdate)}`
        : "Synced";

  const valued = nw.classes.filter((c) => (c.value ?? 0) > 0);

  return (
    <>
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] tracking-wider text-white uppercase">
            Total Portfolio Value
          </p>
          <p className="v3-display text-[34px] leading-none text-white tabular-nums">
            {formatINRShort(nw.total)}
          </p>
          <p className="text-[11px] font-medium text-white">
            {subline}
            {sip && ` · ${sip}`}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-medium text-white">
          {syncing && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white motion-reduce:animate-none" />
          )}
          {pill}
        </span>
      </div>

      <div
        className="relative flex h-3 gap-[3px] overflow-hidden rounded-full bg-white/10"
        role="img"
        aria-label={`Asset allocation: ${nw.classes
          .map(
            (c) =>
              `${c.label} ${c.value == null ? "syncing" : `${Math.round(c.pct)}%`}`,
          )
          .join(", ")}`}
      >
        {valued.map((c) => (
          <span
            key={c.key}
            className="h-full"
            style={{
              flexGrow: c.value ?? 0,
              flexBasis: 0,
              background: `rgba(255,255,255,${alphaFor(nw.classes, c)})`,
            }}
            title={`${c.label} · ${formatINRShort(c.value)} · ${Math.round(c.pct)}%`}
          />
        ))}
        {syncing && (
          <span
            className="h-full"
            style={{
              flexGrow: Math.max(nw.total * 0.18, 1),
              flexBasis: 0,
              backgroundImage: SYNCING_HATCH,
            }}
            title="Syncing…"
          />
        )}
      </div>

      <div
        className={`relative grid gap-2 border-t border-white/15 pt-3 ${
          nw.classes.length > 3 ? "grid-cols-4" : "grid-cols-3"
        }`}
      >
        {nw.classes.map((c) => (
          <div
            key={c.key}
            className="min-w-0"
          >
            <div className="flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={
                  c.status === "syncing"
                    ? { backgroundImage: SYNCING_HATCH, backgroundColor: "rgba(255,255,255,0.25)" }
                    : { background: `rgba(255,255,255,${alphaFor(nw.classes, c)})` }
                }
              />
              <span className="truncate text-[9px] text-white">{c.label}</span>
            </div>
            {c.status === "syncing" ? (
              <span className="mt-1 block h-4 w-14 animate-pulse rounded bg-white/20 motion-reduce:animate-none" />
            ) : (
              <p className="mt-0.5 text-[13px] font-medium text-white tabular-nums">
                {formatINRShort(c.value)}
                <span className="ml-1.5 text-[10px] font-normal text-white">
                  {Math.round(c.pct)}%
                </span>
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function alphaFor(classes: NetworthClass[], c: NetworthClass) {
  return SEGMENT_ALPHA[classes.indexOf(c) % SEGMENT_ALPHA.length];
}

function NetworthEmpty({ onConnect }: { onConnect?: () => void }) {
  return (
    <div className="relative space-y-4">
      <div className="space-y-2">
        <p className="text-[10px] tracking-wider text-white uppercase">
          Total Portfolio Value
        </p>
        <p className="v3-display text-[24px] leading-[1.2] text-white">
          Connect an account to see your net worth
        </p>
        <p className="max-w-[440px] text-[11px] leading-relaxed text-white">
          Link a demat, mutual fund or bank account below — your live portfolio
          value and asset allocation appear here.
        </p>
      </div>
      {onConnect && (
        <button
          onClick={onConnect}
          className="flex w-fit items-center gap-3 rounded-full bg-white py-1.5 pr-1.5 pl-5 text-sm font-medium text-[#0A1F4D] transition-all active:scale-95"
        >
          Connect accounts
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#97edcc]">
            <ArrowRight
              size={15}
              className="text-[#0A1F4D]"
            />
          </span>
        </button>
      )}
    </div>
  );
}

function NetworthSkeleton() {
  const bar = "block animate-pulse rounded bg-white/15 motion-reduce:animate-none";
  return (
    <div
      className="relative space-y-4"
      aria-busy="true"
      aria-label="Loading portfolio value"
    >
      <div className="space-y-2">
        <span className={`${bar} h-3 w-36`} />
        <span className={`${bar} h-9 w-40`} />
        <span className={`${bar} h-3 w-44`} />
      </div>
      <span className={`${bar} h-3 w-full rounded-full`} />
      <div className="grid grid-cols-3 gap-2 border-t border-white/15 pt-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="space-y-1.5"
          >
            <span className={`${bar} h-2.5 w-16`} />
            <span className={`${bar} h-4 w-14`} />
          </div>
        ))}
      </div>
    </div>
  );
}
