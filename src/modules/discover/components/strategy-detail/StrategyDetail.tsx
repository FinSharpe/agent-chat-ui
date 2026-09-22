"use client";

import { useMemo } from "react";
import { useGetStrategyAnalyticsApiStrategiesStrategyNameGet } from "@/api/generated/strategy-apis/strategy-apis/strategy-apis";
import { StrategyAnalyticsResponse } from "@/api/generated/strategy-apis/models";
import FeatureHeader from "@/components/discover/FeatureHeader";
import SoftLoader from "@/components/SoftLoader";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { findStaticIdea } from "../../constants/discover-data";
import { useImportStrategyMutation } from "../../hooks/useImportStrategyMutation";
import { IdeaStrategy } from "../../types/discover.types";
import { downloadHoldingsCsv } from "../../utils/holdings-csv";
import {
  advisorDetailModel,
  basketDetailModel,
} from "../../utils/strategy-detail-model";
import { StrategyDetailView } from "./StrategyDetailView";

interface Props {
  strategyId: string;
  /** The advisor list row, when loaded — gives the header a title early. */
  listItem?: IdeaStrategy;
  onBack: () => void;
}

/** A static basket: placeholder figures, and "Analyse in chat" seeds a chat. */
function BasketDetail({
  idea,
  onBack,
}: {
  idea: IdeaStrategy;
  onBack: () => void;
}) {
  const { createNewChat } = useAppNavigation();
  const model = useMemo(() => basketDetailModel(idea), [idea]);
  const prompt = `I'd like to explore the "${idea.title}" investment idea${
    idea.description ? ` — ${idea.description}` : ""
  }. Which Indian stocks fit it best, and what are the key risks?`;

  return (
    <StrategyDetailView
      model={model}
      onBack={onBack}
      onAnalyse={() => createNewChat(prompt)}
    />
  );
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
    status === 200 && (response?.data as StrategyAnalyticsResponse)?.analytics
      ? (response?.data as StrategyAnalyticsResponse)
      : null;
  const model = useMemo(
    () => (strategy ? advisorDetailModel(strategy) : null),
    [strategy],
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
 * layout, fed by the strategies API for advisor strategies and by placeholder
 * figures for the static baskets.
 */
export function StrategyDetail({ strategyId, listItem, onBack }: Props) {
  const staticIdea = findStaticIdea(strategyId);
  if (staticIdea) {
    return (
      <BasketDetail
        idea={staticIdea}
        onBack={onBack}
      />
    );
  }
  return (
    <AdvisorDetail
      strategyId={strategyId}
      listItem={listItem}
      onBack={onBack}
    />
  );
}
