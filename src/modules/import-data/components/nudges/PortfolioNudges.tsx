"use client";

import {
  finsharpeScoreNudgeApiNudgesFinsharpeScorePost,
  fundamentalNudgeApiNudgesFundamentalPost,
  newsNudgeApiNudgesNewsPost,
  technicalNudgeApiNudgesTechnicalPost,
  useFinsharpeScoreNudgeApiNudgesFinsharpeScorePost,
  useFundamentalNudgeApiNudgesFundamentalPost,
  useNewsNudgeApiNudgesNewsPost,
  useTechnicalNudgeApiNudgesTechnicalPost,
} from "@/api/generated/nudge-apis/nudge-apis/nudge-apis";
import { useQueryClient } from "@tanstack/react-query";
import type {
  FinSharpeScoreNudgeResponse,
  FundamentalNudgeResponse,
  NewsNudgeResponse,
  NudgeRequest,
  TechnicalNudgeResponse,
} from "@/api/generated/nudge-apis/models";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  Building2,
  ChevronDown,
  ChevronUp,
  LineChart,
  Newspaper,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  FinSharpeCards,
  FundamentalCards,
  NewsList,
  NudgeSkeleton,
  TechnicalCards,
} from "./nudge-cards";
import {
  usePortfolioHoldings,
  type PortfolioHolding,
} from "./usePortfolioHoldings";

/** Lazy, refreshable wrapper over a generated nudge query hook. */
function useNudge<TData>(
  // The orval fetch client resolves to a `{ data, status, headers }` envelope,
  // so react-query's `data` is that envelope and the payload is at `data.data`.
  hook: (
    body: NudgeRequest,
    options?: { query?: { enabled?: boolean } },
  ) => {
    data?: { data?: TData };
    queryKey: readonly unknown[];
    isLoading: boolean;
    isFetching: boolean;
  },
  fetchFn: (body: NudgeRequest) => Promise<unknown>,
  holdings: PortfolioHolding[],
  isOpen: boolean,
) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stable body — `refresh` is NOT in the query key, so the lazy read and the
  // manual refresh share one cache entry (no key churn, no skeleton flash).
  const body = useMemo<NudgeRequest>(
    () => ({
      holdings: holdings.map((h) => ({
        type: h.type,
        isin: h.isin,
        name: h.name,
        value: h.value,
      })),
      refresh: false,
    }),
    [holdings],
  );

  const query = hook(body, {
    query: { enabled: isOpen && holdings.length > 0 },
  });

  // Manual refresh: a single imperative call with refresh:true, written straight
  // into the existing cache entry — one request, no key change, no glitch.
  const triggerRefresh = async () => {
    if (holdings.length === 0) return;
    setIsRefreshing(true);
    try {
      const fresh = await fetchFn({ ...body, refresh: true });
      queryClient.setQueryData(query.queryKey, fresh);
    } catch {
      // Keep showing existing data if the refresh fails.
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    data: query.data?.data,
    isPending: query.isLoading,
    isFetching: query.isFetching || isRefreshing,
    triggerRefresh,
  };
}

interface NudgeAccordionProps {
  icon: ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  isFetching: boolean;
  children: ReactNode;
}

function NudgeAccordion({
  icon,
  iconBg,
  title,
  subtitle,
  isOpen,
  onOpenChange,
  onRefresh,
  isFetching,
  children,
}: NudgeAccordionProps) {
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <Card className="border border-gray-200 gap-0">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 transition-colors hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <div className={cn("rounded-lg p-2", iconBg)}>{icon}</div>
              <div className="text-left">
                <h4 className="font-medium text-gray-900">{title}</h4>
                <p className="text-sm text-gray-600">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                role="button"
                tabIndex={-1}
                aria-label={`Refresh ${title}`}
                className="cursor-pointer rounded p-1.5 hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefresh();
                }}
              >
                <RefreshCw
                  className={cn(
                    "h-3 w-3 text-gray-600",
                    isFetching && "animate-spin",
                  )}
                />
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function PortfolioNudges() {
  const { holdings, hasHoldings, hasEquity } = usePortfolioHoldings();

  const [open, setOpen] = useState({
    news: false,
    technical: false,
    fundamental: false,
    finsharpe: false,
  });

  const news = useNudge<NewsNudgeResponse>(
    useNewsNudgeApiNudgesNewsPost,
    newsNudgeApiNudgesNewsPost,
    holdings,
    open.news,
  );
  const technical = useNudge<TechnicalNudgeResponse>(
    useTechnicalNudgeApiNudgesTechnicalPost,
    technicalNudgeApiNudgesTechnicalPost,
    holdings,
    open.technical,
  );
  const fundamental = useNudge<FundamentalNudgeResponse>(
    useFundamentalNudgeApiNudgesFundamentalPost,
    fundamentalNudgeApiNudgesFundamentalPost,
    holdings,
    open.fundamental,
  );
  const finsharpe = useNudge<FinSharpeScoreNudgeResponse>(
    useFinsharpeScoreNudgeApiNudgesFinsharpeScorePost,
    finsharpeScoreNudgeApiNudgesFinsharpeScorePost,
    holdings,
    open.finsharpe,
  );

  // If collapsed, just open it — the lazy query loads from the server cache.
  // If already open, force a fresh regenerate via the imperative refresh.
  const refreshAndOpen = (key: keyof typeof open, trigger: () => void) => {
    if (!open[key]) setOpen((s) => ({ ...s, [key]: true }));
    else trigger();
  };

  if (!hasHoldings) return null;

  return (
    <div>
      <h3 className="mb-4 font-medium text-gray-900">Portfolio Nudges</h3>
      <div className="space-y-3">
        {hasEquity && (
          <>
            <NudgeAccordion
              icon={<Newspaper className="h-4 w-4 text-purple-600" />}
              iconBg="bg-purple-50"
              title="News"
              subtitle="Latest market and company updates"
              isOpen={open.news}
              onOpenChange={(o) => setOpen((s) => ({ ...s, news: o }))}
              onRefresh={() => refreshAndOpen("news", news.triggerRefresh)}
              isFetching={news.isFetching}
            >
              {news.isPending ? (
                <NudgeSkeleton />
              ) : (
                <NewsList articles={news.data?.articles ?? []} />
              )}
            </NudgeAccordion>

            <NudgeAccordion
              icon={<LineChart className="h-4 w-4 text-blue-600" />}
              iconBg="bg-blue-50"
              title="Technical"
              subtitle="Chart patterns and technical signals"
              isOpen={open.technical}
              onOpenChange={(o) => setOpen((s) => ({ ...s, technical: o }))}
              onRefresh={() =>
                refreshAndOpen("technical", technical.triggerRefresh)
              }
              isFetching={technical.isFetching}
            >
              {technical.isPending ? (
                <NudgeSkeleton />
              ) : (
                <TechnicalCards cards={technical.data?.cards ?? []} />
              )}
            </NudgeAccordion>

            <NudgeAccordion
              icon={<Building2 className="h-4 w-4 text-green-600" />}
              iconBg="bg-green-50"
              title="Fundamental"
              subtitle="Financial metrics and valuations"
              isOpen={open.fundamental}
              onOpenChange={(o) => setOpen((s) => ({ ...s, fundamental: o }))}
              onRefresh={() =>
                refreshAndOpen("fundamental", fundamental.triggerRefresh)
              }
              isFetching={fundamental.isFetching}
            >
              {fundamental.isPending ? (
                <NudgeSkeleton />
              ) : (
                <FundamentalCards cards={fundamental.data?.cards ?? []} />
              )}
            </NudgeAccordion>
          </>
        )}

        <NudgeAccordion
          icon={<Sparkles className="h-4 w-4 text-purple-600" />}
          iconBg="bg-gradient-to-br from-purple-50 to-blue-50"
          title="FinSharpe Score"
          subtitle="Proprietary scores vs industry"
          isOpen={open.finsharpe}
          onOpenChange={(o) => setOpen((s) => ({ ...s, finsharpe: o }))}
          onRefresh={() =>
            refreshAndOpen("finsharpe", finsharpe.triggerRefresh)
          }
          isFetching={finsharpe.isFetching}
        >
          {finsharpe.isPending ? (
            <NudgeSkeleton />
          ) : (
            <FinSharpeCards cards={finsharpe.data?.cards ?? []} />
          )}
        </NudgeAccordion>
      </div>
    </div>
  );
}
