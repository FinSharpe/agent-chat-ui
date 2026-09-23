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
import type {
  FinSharpeScoreNudgeResponse,
  FundamentalNudgeResponse,
  NewsNudgeResponse,
  TechnicalNudgeResponse,
} from "@/api/generated/nudge-apis/models";
import { SectionBanner } from "@/components/shared/SectionKit";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { Bell, RefreshCw } from "lucide-react";
import type { ReactNode, Ref } from "react";
import { useInView } from "../../hooks/useInView";
import { RowLabel, SectionTitle } from "../page/SectionTitle";
import {
  AlertCardSkeleton,
  FundamentalAlertCard,
  InsightCard,
  InsightSkeletonRow,
  NewsCard,
  RowMessage,
  TechnicalAlertCard,
} from "./nudge-cards";
import { rowCardWidth } from "./layout";
import { useNudge } from "./useNudge";
import { usePortfolioHoldings } from "./usePortfolioHoldings";

/**
 * Smart Alerts — the reference Import screen's alerts, filled from the
 * holding-scoped nudge APIs: FinSharpe Insights (FinSharpe Score), then a
 * "Deep Dive" banner over the News, Technical and Fundamental rows (equity
 * only). Each row fetches once it nears the viewport.
 */
export function PortfolioNudges() {
  const { holdings, hasHoldings, hasEquity, isLoading } = usePortfolioHoldings();

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-1.5 px-1">
        <Bell
          size={13}
          className="text-[#063BAA]"
        />
        <SectionTitle>Smart Alerts</SectionTitle>
      </div>

      {isLoading ? (
        <InsightsFrame>
          <InsightSkeletonRow />
        </InsightsFrame>
      ) : !hasHoldings ? (
        <NoHoldingsCard />
      ) : (
        <NudgeRows
          holdings={holdings}
          hasEquity={hasEquity}
        />
      )}
    </section>
  );
}

function NudgeRows({
  holdings,
  hasEquity,
}: {
  holdings: ReturnType<typeof usePortfolioHoldings>["holdings"];
  hasEquity: boolean;
}) {
  const isDesktopWeb = useIsDesktopWeb();
  const { createNewChat } = useAppNavigation();
  const width = rowCardWidth(isDesktopWeb);

  const insightsView = useInView<HTMLDivElement>();
  const newsView = useInView<HTMLElement>();
  const technicalView = useInView<HTMLElement>();
  const fundamentalView = useInView<HTMLElement>();

  const finsharpe = useNudge<FinSharpeScoreNudgeResponse>(
    useFinsharpeScoreNudgeApiNudgesFinsharpeScorePost,
    finsharpeScoreNudgeApiNudgesFinsharpeScorePost,
    holdings,
    insightsView.inView,
  );
  const news = useNudge<NewsNudgeResponse>(
    useNewsNudgeApiNudgesNewsPost,
    newsNudgeApiNudgesNewsPost,
    holdings,
    newsView.inView && hasEquity,
  );
  const technical = useNudge<TechnicalNudgeResponse>(
    useTechnicalNudgeApiNudgesTechnicalPost,
    technicalNudgeApiNudgesTechnicalPost,
    holdings,
    technicalView.inView && hasEquity,
  );
  const fundamental = useNudge<FundamentalNudgeResponse>(
    useFundamentalNudgeApiNudgesFundamentalPost,
    fundamentalNudgeApiNudgesFundamentalPost,
    holdings,
    fundamentalView.inView && hasEquity,
  );

  const insightCards = (finsharpe.data?.cards ?? []).filter(
    (c) => c.coverage !== "not_covered",
  );
  const technicalCards = (technical.data?.cards ?? []).filter(
    (c) => c.coverage !== "not_covered",
  );
  const fundamentalCards = (fundamental.data?.cards ?? []).filter(
    (c) => c.coverage !== "not_covered",
  );

  return (
    <>
      {/* FinSharpe Insights — desktop: two-up slider; mobile: one card
          listing each insight, scrolling inside itself past the first two. */}
      <div
        ref={insightsView.ref}
        className="space-y-3"
      >
        <RowHeader
          label="FinSharpe Insights"
          isFetching={finsharpe.isFetching}
          onRefresh={finsharpe.triggerRefresh}
        />
        {isRowLoading(finsharpe, insightsView.inView) ? (
          isDesktopWeb ? (
            <Slider>
              <AlertCardSkeleton width={width} />
              <AlertCardSkeleton width={width} />
            </Slider>
          ) : (
            <InsightsFrame>
              <InsightSkeletonRow />
              <InsightSkeletonRow />
            </InsightsFrame>
          )
        ) : finsharpe.isError ? (
          <ErrorMessage
            what="FinSharpe insights"
            onRetry={finsharpe.retry}
          />
        ) : insightCards.length === 0 ? (
          <RowMessage>No FinSharpe scores for your holdings yet.</RowMessage>
        ) : isDesktopWeb ? (
          <Slider>
            {insightCards.map((card) => (
              <InsightCard
                key={card.holding.isin}
                card={card}
                variant="slide"
                onAsk={createNewChat}
              />
            ))}
          </Slider>
        ) : (
          <InsightsFrame>
            {insightCards.map((card) => (
              <InsightCard
                key={card.holding.isin}
                card={card}
                variant="row"
                onAsk={createNewChat}
              />
            ))}
          </InsightsFrame>
        )}
      </div>

      {hasEquity && (
        <>
          {/* Breaker card introducing the three rows below. */}
          <SectionBanner
            eyebrow="Deep Dive"
            title="News, technical setups and fundamentals for what you hold"
            tone="mint"
            height={260}
            image="/graphics/import-signals.jpg"
            imageScrim
          />

          <AlertRow
            sectionRef={newsView.ref}
            label="News"
            nudge={news}
            seen={newsView.inView}
            count={news.data?.articles?.length ?? 0}
            empty="No recent news for your holdings."
            width={width}
          >
            {(news.data?.articles ?? []).map((a, i) => (
              <NewsCard
                key={`${a.isin}-${i}`}
                article={a}
                width={width}
                onDiscuss={createNewChat}
              />
            ))}
          </AlertRow>

          <AlertRow
            sectionRef={technicalView.ref}
            label="Technical"
            nudge={technical}
            seen={technicalView.inView}
            count={technicalCards.length}
            empty="No technical signals for your holdings right now."
            width={width}
          >
            {technicalCards.map((card) => (
              <TechnicalAlertCard
                key={card.holding.isin}
                card={card}
                width={width}
              />
            ))}
          </AlertRow>

          <AlertRow
            sectionRef={fundamentalView.ref}
            label="Fundamental"
            nudge={fundamental}
            seen={fundamentalView.inView}
            count={fundamentalCards.length}
            empty="No fundamental data for your holdings yet."
            width={width}
          >
            {fundamentalCards.map((card) => (
              <FundamentalAlertCard
                key={card.holding.isin}
                card={card}
                width={width}
              />
            ))}
          </AlertRow>
        </>
      )}
    </>
  );
}

/** Pending until the row has been reached, then while its first fetch runs. */
function isRowLoading(
  n: { isPending: boolean; data?: unknown; isError: boolean },
  seen: boolean,
) {
  return !seen || (n.isPending && !n.data && !n.isError);
}

/** One titled, horizontally scrolling alert row (News / Technical / …). */
function AlertRow({
  sectionRef,
  label,
  nudge,
  seen,
  count,
  empty,
  width,
  children,
}: {
  sectionRef: Ref<HTMLElement>;
  label: string;
  nudge: ReturnType<typeof useNudge>;
  seen: boolean;
  count: number;
  empty: string;
  width: string;
  children: ReactNode;
}) {
  return (
    <section
      ref={sectionRef}
      className="space-y-3"
    >
      <RowHeader
        label={label}
        isFetching={nudge.isFetching}
        onRefresh={nudge.triggerRefresh}
      />
      {isRowLoading(nudge, seen) ? (
        <Slider>
          <AlertCardSkeleton width={width} />
          <AlertCardSkeleton width={width} />
        </Slider>
      ) : nudge.isError ? (
        <ErrorMessage
          what={label.toLowerCase()}
          onRetry={nudge.retry}
        />
      ) : count === 0 ? (
        <RowMessage>{empty}</RowMessage>
      ) : (
        <Slider>{children}</Slider>
      )}
    </section>
  );
}

function Slider({ children }: { children: ReactNode }) {
  const isDesktopWeb = useIsDesktopWeb();
  return (
    <div
      className={`scrollbar-none flex snap-x snap-mandatory overflow-x-auto pb-1 ${isDesktopWeb ? "gap-4.5" : "gap-3"}`}
    >
      {children}
    </div>
  );
}

function InsightsFrame({ children }: { children: ReactNode }) {
  return (
    <div className="glass-card scrollbar-none max-h-[406px] divide-y divide-slate-100 overflow-y-auto rounded-card dark:divide-slate-800/60">
      {children}
    </div>
  );
}

/** Row label with the regenerate control the old nudge accordions had. */
function RowHeader({
  label,
  isFetching,
  onRefresh,
}: {
  label: string;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <RowLabel>{label}</RowLabel>
      <button
        onClick={onRefresh}
        disabled={isFetching}
        aria-label={`Refresh ${label}`}
        title={`Refresh ${label}`}
        className="hover-tint -my-1.5 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-[#063BAA] disabled:opacity-60"
      >
        <RefreshCw
          size={12}
          className={isFetching ? "animate-spin motion-reduce:animate-none" : ""}
        />
      </button>
    </div>
  );
}

function ErrorMessage({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <RowMessage
      action={
        <button
          onClick={onRetry}
          className="shrink-0 rounded-full bg-[#DFF9EF] px-3 py-1.5 text-[10px] font-medium text-[#0A1F4D]"
        >
          Try again
        </button>
      }
    >
      Couldn&apos;t load {what} right now.
    </RowMessage>
  );
}

/** Shown instead of the alerts until an equity or MF account is connected. */
function NoHoldingsCard() {
  return (
    <div className="glass-card premium-shadow-sm flex items-start gap-3.5 rounded-card p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#063BAA]/8 text-[#063BAA]">
        <Bell size={18} />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-forest-deep font-geist text-[13px] leading-snug font-medium dark:text-white">
          Alerts start once your holdings are in
        </p>
        <p className="text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
          Connect your demat or mutual fund account below and FinSharpe will
          surface news, technical setups, fundamentals and score changes for
          what you hold.
        </p>
      </div>
    </div>
  );
}
