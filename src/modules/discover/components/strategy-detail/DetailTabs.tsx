"use client";

import {
  BarePanels,
  DataPanel,
} from "@/modules/import-data/components/shared/ui";
import {
  AllocationSections,
  AnalysedHoldingsCard,
} from "@/modules/import-data/components/modals/HoldingsPreviewModal/components/analysis/HoldingsSections";
import { EquityFundamentals } from "@/modules/import-data/components/modals/HoldingsPreviewModal/components/analysis/MetricComparison";
import { ScoresSection } from "@/modules/import-data/components/modals/HoldingsPreviewModal/components/analysis/ScoresSection";
import {
  ConcentrationCard,
  MoversCard,
} from "@/modules/import-data/components/modals/HoldingsPreviewModal/components/analysis/SnapshotSections";
import { DetailTabId, StrategyDetailModel } from "../../types/discover.types";
import { formatDayPct, shortDate } from "../../utils/format";
import { RebalanceHistory } from "./RebalanceHistory";

const TAB_LABELS: Record<DetailTabId, string> = {
  overview: "Overview",
  holdings: "Holdings",
  quality: "Quality",
  rebalances: "Rebalances",
};

function Overview({ model }: { model: StrategyDetailModel }) {
  const s = model.snapshot;
  const move = s.day_move;
  return (
    <>
      <MoversCard
        moves={s.holding_moves ?? []}
        addon={move ? shortDate(move.as_of) : undefined}
        note={`Each holding's weight × its own move for the session. They sum to the portfolio's ${move ? formatDayPct(move.pct) : "move"}.`}
      />
      <ScoresSection
        kind="equities"
        profile={s.score_profile ?? []}
        primaryScore={null}
        riskScore={null}
      />
      <AllocationSections
        industry={model.industry}
        categories={[]}
        size={model.size}
      />
      {s.concentration && <ConcentrationCard c={s.concentration} />}
      {model.excluded.length > 0 && (
        <DataPanel title="Excluded from analytics">
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            These holdings are missing market data, so the figures above leave
            them out.
          </p>
          <div className="divide-border-subtle mt-1 divide-y">
            {model.excluded.map((h) => (
              <div
                key={h.ticker}
                className="flex items-center gap-3 py-2.5 text-[11px]"
              >
                <span className="text-forest-deep w-24 truncate font-medium dark:text-white">
                  {h.ticker}
                </span>
                <span className="flex-1 truncate text-slate-500 dark:text-slate-400">
                  {h.reason}
                </span>
                <span className="text-slate-500 tabular-nums dark:text-slate-400">
                  {h.weight}
                </span>
              </div>
            ))}
          </div>
        </DataPanel>
      )}
    </>
  );
}

/**
 * The pill tab bar and its cardless content — the import analysis cards,
 * unframed, divided by hairlines. Tab for tab finsharpe-mobile's strategy
 * detail: Overview, Holdings, Quality, Rebalances.
 */
export function DetailTabs({
  model,
  tab,
  onTab,
  inPopup,
}: {
  model: StrategyDetailModel;
  tab: DetailTabId;
  onTab: (t: DetailTabId) => void;
  inPopup: boolean;
}) {
  return (
    <>
      <div
        className={`scrollbar-none flex gap-2 overflow-x-auto px-5 ${inPopup ? "py-5" : "py-3.5"}`}
      >
        {model.tabs.map((t) => (
          <button
            key={t}
            onClick={() => onTab(t)}
            className={`${inPopup ? "flex-1 text-center" : "px-4"} rounded-full py-2 text-[11px] font-medium whitespace-nowrap transition-colors ${tab === t ? "bg-[#063BAA] text-white" : "bg-[#063BAA]/6 text-slate-500"}`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="divide-y divide-slate-100 px-5 dark:divide-slate-800/60 [&>section:first-child]:pt-1">
        <BarePanels>
          {tab === "overview" && <Overview model={model} />}
          {tab === "holdings" && (
            <AnalysedHoldingsCard
              holdings={model.holdings}
              moves={model.snapshot.holding_moves ?? []}
            />
          )}
          {tab === "quality" && (
            <EquityFundamentals metrics={model.snapshot.fundamentals ?? []} />
          )}
          {tab === "rebalances" && (
            <RebalanceHistory
              events={model.snapshot.rebalance_history ?? []}
              strategy={model.id}
            />
          )}
        </BarePanels>
      </div>
    </>
  );
}
