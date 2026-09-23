"use client";

import { useMemo } from "react";
import { useGetStrategyAnalyticsApiStrategiesStrategyNameGet } from "@/api/generated/strategy-apis/strategy-apis/strategy-apis";
import FeatureHeader from "@/components/discover/FeatureHeader";
import SoftLoader from "@/components/SoftLoader";
import { useImportStrategyMutation } from "../../hooks/useImportStrategyMutation";
import { IdeaStrategy } from "../../types/discover.types";
import { StrategyDetailResponse } from "../../types/strategy-api";
import { downloadHoldingsCsv } from "../../utils/holdings-csv";
import { advisorDetailModel } from "../../utils/strategy-detail-model";
import { StrategyDetailView } from "./StrategyDetailView";

interface Props {
  strategyId: string;
  /** The advisor list row, when loaded — gives the header a title early. */
  listItem?: IdeaStrategy;
  onBack: () => void;
}

/** An advisor strategy: real analytics from the strategies API. */
function AdvisorDetail({ strategyId, listItem, onBack }: Props) {
  const query = useGetStrategyAnalyticsApiStrategiesStrategyNameGet(
    encodeURIComponent(strategyId),
    { query: { staleTime: 5 * 60 * 1000 } },
  );
  const importMutation = useImportStrategyMutation();

  const response = query.data;
  // The generated fetcher resolves on any HTTP status; only a 200 with
  // analytics is a strategy.
  const status: number | undefined = response?.status;
  const strategy =
    status === 200 && (response?.data as StrategyDetailResponse)?.analytics
      ? (response?.data as StrategyDetailResponse)
      : null;
  const model = useMemo(
    () => (strategy ? advisorDetailModel(strategy, listItem) : null),
    [strategy, listItem],
  );

  if (!model || !strategy) {
    const notFound = status === 404;
    const failed = query.isError || (response && !strategy);
    return (
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-transparent">
        <FeatureHeader
          title={listItem?.title ?? "Strategy"}
          onBack={onBack}
        />
        {query.isLoading || (!failed && !notFound) ? (
          <SoftLoader
            variant="wave"
            message="Loading strategy"
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-8 pb-[130px] text-center">
            <p className="font-geist text-[13px] font-medium text-[#0A1F4D]">
              {notFound ? "Strategy not found" : "Couldn't load this strategy"}
            </p>
            <p className="text-[11px] text-slate-500">
              {notFound
                ? "It may have been retired from the catalog."
                : "Please check your connection and try again."}
            </p>
            {!notFound && (
              <button
                onClick={() => query.refetch()}
                className="mt-3 rounded-full bg-[#063BAA]/8 px-4 py-2 text-[11px] font-medium text-[#063BAA] transition-colors"
              >
                Try again
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <StrategyDetailView
      model={model}
      onBack={onBack}
      onAnalyse={() => importMutation.mutate({ strategy })}
      analysing={importMutation.isPending}
      onDownload={() => downloadHoldingsCsv(strategy)}
      shareId={strategy.strategy}
    />
  );
}

/**
 * Strategy detail for Explore Investment Ideas — the reference StrategyDetail
 * layout, fed by the strategies API. Every category but "Created by Advisors"
 * is disabled and empty, so there is nothing else this can be asked to render
 * (T-04): an id that is not an advisor strategy is a retired or invented one,
 * and AdvisorDetail says so rather than drawing figures for it.
 */
export function StrategyDetail({ strategyId, listItem, onBack }: Props) {
  return (
    <AdvisorDetail
      strategyId={strategyId}
      listItem={listItem}
      onBack={onBack}
    />
  );
}
