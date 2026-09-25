"use client";
import { ArrowRight } from "lucide-react";
import { formatINRShort } from "../utils/inr";
import { formatLastUpdated } from "../utils/date-formatting";
import { dayMoveLine, dayMovePill } from "../utils/day-move";
import { shortDate } from "./modals/HoldingsPreviewModal/components/analysis/format";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import {
  useNetworthData,
  type NetworthClassKey,
  type NetworthData,
} from "../hooks/useNetworthData";
import { SectionTitle } from "./page/SectionTitle";

/**
 * Class colours on the navy card — finsharpe-mobile's `allocationColor(…,
 * onDark: true)` ramp, pinned dark in both themes because the light blues
 * vanish into the gradient. The breakdown dots use the same colours, so the
 * grid is the bar's legend. Change the two apps together.
 */
const CLASS_ON_NAVY: Record<NetworthClassKey, string> = {
  [ConsentType.EQUITIES]: "#8FB4FF",
  [ConsentType.MUTUAL_FUNDS]: "#2563EB",
  [ConsentType.ETF]: "#97EDCC",
  [ConsentType.BANK_ACCOUNTS]: "#94A3B8",
};

/** Mobile's `AssetClass.compactLabel` — the third-width cells clip full names. */
const COMPACT_LABEL: Record<NetworthClassKey, string> = {
  [ConsentType.EQUITIES]: "Equities",
  [ConsentType.MUTUAL_FUNDS]: "MF",
  [ConsentType.ETF]: "ETFs",
  [ConsentType.BANK_ACCOUNTS]: "Bank",
};

/** Mint for a gain, rose for a loss — the only inks that read on the navy. */
const GAIN_INK = "#97EDCC";
const LOSS_INK = "#FDA4AF";

/** Diagonal hatch for a class that is still syncing. */
const SYNCING_HATCH =
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.35) 0 4px, transparent 4px 8px)";

/**
 * "My net worth" — finsharpe-mobile's portfolio summary card
 * (`portfolio_tab.dart` `_SummaryCard`), driven by the live MoneyOne data
 * aggregated in useNetworthData: the total, today's move of the invested book
 * (`utils/day-move.ts`) and the split by class.
 */
export function NetworthGraph({ onConnect }: { onConnect?: () => void }) {
  const nw = useNetworthData();
  const updated =
    !nw.isInitialLoading && !nw.isEmpty && nw.latestUpdate
      ? `Updated ${formatLastUpdated(nw.latestUpdate)?.toLowerCase()}`
      : null;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 pr-1">
        <SectionTitle>My net worth</SectionTitle>
        {updated && (
          <span className="text-muted-foreground text-[10px] font-medium">
            {updated}
          </span>
        )}
      </div>
      <div className="bg-brand-gradient premium-shadow-sm card-hover rounded-card relative overflow-hidden p-6">
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
  // Only once every class is in: a move over part of the book would be quoted
  // as the whole of it.
  const move = syncing ? null : nw.dayMove;
  const moving = move?.status === "loading";
  const moved = move?.status === "ready" ? move : null;

  const subline = syncing
    ? `${nw.readyCount} of ${nw.connectedCount} account types synced`
    : moved
      ? dayMoveLine(moved.delta)
      : null;
  // Mint for a gain, rose for a loss; zero reads as a gain, as its `+` does.
  const sublineInk =
    syncing || !moved
      ? "rgba(255,255,255,0.6)"
      : moved.delta >= 0
        ? GAIN_INK
        : LOSS_INK;

  const pill = syncing ? "Updating…" : moved ? dayMovePill(moved.pct) : null;
  const pillTitle = moved
    ? `Your holdings' move over the latest session${moved.asOf ? `, to the close of ${shortDate(moved.asOf)}` : ""}`
    : undefined;

  const valued = nw.classes.filter((c) => (c.value ?? 0) > 0);
  // Like mobile, a class worth nothing is left out of the legend; one still
  // syncing keeps its cell so the wait is visible.
  const cells = nw.classes.filter(
    (c) => c.status === "syncing" || (c.value ?? 0) > 0,
  );

  return (
    <div className="relative">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-normal tracking-[0.07em] text-white/60 uppercase">
            Total Portfolio Value
          </p>
          <p className="v3-display mt-2 text-[34px] leading-[1.05] text-white tabular-nums">
            {formatINRShort(nw.total)}
          </p>
          {subline && (
            <p
              className="mt-1 text-[11px] font-medium tabular-nums"
              style={{ color: sublineInk }}
            >
              {subline}
            </p>
          )}
          {moving && (
            <span
              className="mt-1.5 block h-3 w-24 animate-pulse rounded bg-white/15 motion-reduce:animate-none"
              aria-hidden
            />
          )}
        </div>
        {pill && (
          <span
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap text-white tabular-nums"
            title={pillTitle}
          >
            {syncing && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white motion-reduce:animate-none" />
            )}
            {pill}
          </span>
        )}
        {moving && (
          <span
            className="h-6 w-24 shrink-0 animate-pulse rounded-full bg-white/15 motion-reduce:animate-none"
            aria-hidden
          />
        )}
      </div>

      {(valued.length > 0 || syncing) && (
        <div
          className="mt-4 flex h-1.5 gap-[2px] overflow-hidden rounded-full bg-white/15"
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
                background: CLASS_ON_NAVY[c.key],
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
      )}

      {cells.length > 0 && (
        <>
          <div className="mt-4 h-px bg-white/15" />

          {/* Three to a row at every width, like mobile's Wrap — a fourth class
          starts the next row rather than squeezing the others. */}
          <div className="mt-3 flex flex-wrap gap-x-2 gap-y-3">
            {cells.map((c) => (
              <div
                key={c.key}
                className="w-[calc((100%_-_16px)/3)] min-w-0 shrink-0"
              >
                <div className="flex items-center gap-1">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={
                      c.status === "syncing"
                        ? {
                            backgroundImage: SYNCING_HATCH,
                            backgroundColor: "rgba(255,255,255,0.25)",
                          }
                        : { background: CLASS_ON_NAVY[c.key] }
                    }
                  />
                  <span className="truncate text-[9px] font-normal text-white/60 tabular-nums">
                    {COMPACT_LABEL[c.key]}
                    {c.status === "ready" && ` · ${Math.round(c.pct)}%`}
                  </span>
                </div>
                {c.status === "syncing" ? (
                  <span className="mt-1 block h-4 w-14 animate-pulse rounded bg-white/20 motion-reduce:animate-none" />
                ) : (
                  <p className="mt-0.5 text-[13px] font-semibold text-white tabular-nums">
                    {formatINRShort(c.value)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NetworthEmpty({ onConnect }: { onConnect?: () => void }) {
  return (
    <div className="relative space-y-4">
      <div className="space-y-2">
        <p className="text-[10px] font-normal tracking-[0.07em] text-white/60 uppercase">
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
  const bar =
    "block animate-pulse rounded bg-white/15 motion-reduce:animate-none";
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
      <span className={`${bar} h-1.5 w-full rounded-full`} />
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
