"use client";

import {
  fundamentalNudgeApiNudgesFundamentalPost,
  newsNudgeApiNudgesNewsPost,
  smartAlertsApiNudgesAlertsPost,
  technicalNudgeApiNudgesTechnicalPost,
  useFundamentalNudgeApiNudgesFundamentalPost,
  useNewsNudgeApiNudgesNewsPost,
  useSmartAlertsApiNudgesAlertsPost,
  useTechnicalNudgeApiNudgesTechnicalPost,
} from "@/api/generated/nudge-apis/nudge-apis/nudge-apis";
import type {
  FundamentalNudgeResponse,
  NewsNudgeResponse,
  SmartAlertsResponse,
  TechnicalNudgeResponse,
} from "@/api/generated/nudge-apis/models";
import { SectionBanner } from "@/components/shared/SectionKit";
import { SeeAllLink } from "@/components/shared/SeeAllLink";
import { useRouter } from "next/navigation";
import { HOLDINGS_NEWS_ROUTE } from "../../constants/routes";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { Bell, RefreshCw } from "lucide-react";
import { useMemo, type ReactNode, type Ref } from "react";
import { newsAskPrompt } from "@/modules/discover/api/market-news";
import {
  NewsCard,
  NewsCardSkeleton,
} from "@/modules/discover/components/news/NewsCard";
import { useInView } from "../../hooks/useInView";
import {
  fundamentalSignalMessage,
  signalSymbol,
  technicalSignalMessage,
} from "../../utils/chat-handoffs";
import { holdingsNewsItem } from "../../utils/holdings-news";
import {
  fromServed,
  groupSmartAlerts,
  sipAlerts,
  type SmartAlertItem,
} from "../../utils/smart-alerts";
import { RowLabel, SectionTitle } from "../page/SectionTitle";
import { RowMessage, SignalCard, SignalCardSkeleton } from "./nudge-cards";
import {
  SmartAlertsCard,
  SmartAlertSkeleton,
  SmartAlertsFrame,
} from "./SmartAlertsCard";
import { useNudge } from "./useNudge";
import { usePortfolioHoldings } from "./usePortfolioHoldings";

/**
 * Smart Alerts — the reference Import screen's alerts: one card grouped by
 * asset class (#86, from `POST /nudges/alerts` plus the SIP rules worked out
 * here), then a "Deep Dive" banner over the News, Technical and Fundamental
 * rows (equity only). Each fetches once it nears the viewport.
 *
 * The Deep Dive rows mirror finsharpe-mobile's `_SmartAlertsSection`
 * (`portfolio_tab.dart`, #140 / #145): News draws the shared news card, and
 * Technical and Fundamental carry an `Ask AI` link seeding chat with the
 * card's own question. A row with nothing to show renders nothing.
 */
export function PortfolioNudges() {
  const portfolio = usePortfolioHoldings();

  if (portfolio.isLoading || !portfolio.hasHoldings) {
    return (
      <section className="space-y-6">
        <SmartAlertsTitle />
        {portfolio.isLoading ? (
          <SmartAlertsFrame>
            <SmartAlertSkeleton />
          </SmartAlertsFrame>
        ) : (
          <NoHoldingsCard />
        )}
      </section>
    );
  }
  return <NudgeRows portfolio={portfolio} />;
}

function SmartAlertsTitle({ action }: { action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-1.5">
        <Bell
          size={13}
          className="text-[#063BAA]"
        />
        <SectionTitle>Smart Alerts</SectionTitle>
      </div>
      {action}
    </div>
  );
}

function NudgeRows({
  portfolio,
}: {
  portfolio: ReturnType<typeof usePortfolioHoldings>;
}) {
  const { holdings, deepDiveHoldings, hasEquity, alertClasses, sipBook } =
    portfolio;
  const router = useRouter();
  const { createNewChat } = useAppNavigation();

  const alertsView = useInView<HTMLDivElement>();
  const newsView = useInView<HTMLElement>();
  const technicalView = useInView<HTMLElement>();
  const fundamentalView = useInView<HTMLElement>();

  const alerts = useNudge<SmartAlertsResponse>(
    useSmartAlertsApiNudgesAlertsPost,
    smartAlertsApiNudgesAlertsPost,
    holdings,
    alertsView.inView,
  );
  const news = useNudge<NewsNudgeResponse>(
    useNewsNudgeApiNudgesNewsPost,
    newsNudgeApiNudgesNewsPost,
    deepDiveHoldings,
    newsView.inView && hasEquity,
  );
  const technical = useNudge<TechnicalNudgeResponse>(
    useTechnicalNudgeApiNudgesTechnicalPost,
    technicalNudgeApiNudgesTechnicalPost,
    deepDiveHoldings,
    technicalView.inView && hasEquity,
  );
  const fundamental = useNudge<FundamentalNudgeResponse>(
    useFundamentalNudgeApiNudgesFundamentalPost,
    fundamentalNudgeApiNudgesFundamentalPost,
    deepDiveHoldings,
    fundamentalView.inView && hasEquity,
  );

  const served = alerts.data?.alerts;
  const groups = useMemo(() => {
    const servedAlerts = (served ?? [])
      .map(fromServed)
      .filter((a): a is SmartAlertItem => a !== null);
    return groupSmartAlerts({
      held: alertClasses,
      alerts: [
        ...servedAlerts,
        ...sipAlerts(sipBook.sips, {
          transactionsEnd: sipBook.transactionsEnd,
          today: new Date(),
        }),
      ],
      // SIPs are worked out here, so they are always checked; the served
      // classes only once the alerts feed answered.
      checked: (type) => type === "SIP" || served != null,
    });
  }, [served, alertClasses, sipBook]);

  const technicalCards = (technical.data?.cards ?? []).filter(
    (c) => c.coverage !== "not_covered",
  );
  const fundamentalCards = (fundamental.data?.cards ?? []).filter(
    (c) => c.coverage !== "not_covered",
  );

  return (
    <section className="space-y-6">
      <SmartAlertsTitle
        action={
          <RefreshButton
            label="Smart Alerts"
            isFetching={alerts.isFetching}
            onRefresh={alerts.triggerRefresh}
          />
        }
      />

      {/* One card grouped by class, scrolling inside itself past about two
          alerts — on desktop too, where the old insights slider sat. */}
      <div
        ref={alertsView.ref}
        className="space-y-3"
      >
        {isRowLoading(alerts, alertsView.inView) ? (
          <SmartAlertsFrame>
            <SmartAlertSkeleton />
            <SmartAlertSkeleton />
          </SmartAlertsFrame>
        ) : (
          <>
            {/* A failed feed hides the served classes rather than calling
                them clear; the SIPs worked out here still show. */}
            {alerts.isError && (
              <ErrorMessage
                what="smart alerts"
                onRetry={alerts.retry}
              />
            )}
            {groups.length > 0 && (
              <SmartAlertsCard
                groups={groups}
                onAsk={(alert) => createNewChat(alert.question)}
              />
            )}
          </>
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
            // No refresh control: mobile's News strip has none, and See all
            // is where the rest of the feed lives.
            refreshable={false}
            // The row is page 1 of the holdings news (#174): See all only when
            // there is a page 2 to see.
            action={
              news.data?.nextCursor ? (
                <SeeAllLink
                  label="See all holdings news"
                  onClick={() => router.push(HOLDINGS_NEWS_ROUTE)}
                />
              ) : null
            }
            skeleton={<NewsCardSkeleton fixedHeight />}
          >
            {(news.data?.articles ?? []).map((a, i) => (
              <NewsCard
                key={`${a.isin}-${i}`}
                item={holdingsNewsItem(a)}
                onAsk={(item) => createNewChat(newsAskPrompt(item.title))}
                fixedHeight
              />
            ))}
          </AlertRow>

          <AlertRow
            sectionRef={technicalView.ref}
            label="Technical"
            nudge={technical}
            seen={technicalView.inView}
            count={technicalCards.length}
            skeleton={<SignalCardSkeleton />}
          >
            {technicalCards.map((card) => (
              <SignalCard
                key={card.holding.isin}
                card={card}
                onAsk={() =>
                  createNewChat(
                    technicalSignalMessage({
                      symbol: signalSymbol(card.holding),
                      badge: card.badge?.label,
                      line: card.line,
                    }),
                  )
                }
              />
            ))}
          </AlertRow>

          <AlertRow
            sectionRef={fundamentalView.ref}
            label="Fundamental"
            nudge={fundamental}
            seen={fundamentalView.inView}
            count={fundamentalCards.length}
            skeleton={<SignalCardSkeleton />}
          >
            {fundamentalCards.map((card) => (
              <SignalCard
                key={card.holding.isin}
                card={card}
                onAsk={() =>
                  createNewChat(
                    fundamentalSignalMessage({
                      symbol: signalSymbol(card.holding),
                      badge: card.badge?.label,
                      line: card.line,
                    }),
                  )
                }
              />
            ))}
          </AlertRow>
        </>
      )}
    </section>
  );
}

/** Pending until the row has been reached, then while its first fetch runs. */
function isRowLoading(
  n: { isPending: boolean; data?: unknown; isError: boolean },
  seen: boolean,
) {
  return !seen || (n.isPending && !n.data && !n.isError);
}

/**
 * One titled, horizontally scrolling row (News / Technical / Fundamental).
 * Loaded and empty, it renders nothing, as mobile's strips do — the section
 * stays mounted, hidden, only because its ref is what triggered the fetch. A
 * failed load says so rather than disappearing.
 */
function AlertRow({
  sectionRef,
  label,
  nudge,
  seen,
  count,
  skeleton,
  action,
  refreshable = true,
  children,
}: {
  sectionRef: Ref<HTMLElement>;
  label: string;
  nudge: ReturnType<typeof useNudge>;
  seen: boolean;
  count: number;
  skeleton: ReactNode;
  /** A head action beside the refresh control, such as See all. */
  action?: ReactNode;
  /** Whether the head carries the regenerate control. */
  refreshable?: boolean;
  children: ReactNode;
}) {
  const loading = isRowLoading(nudge, seen);
  const empty = !loading && !nudge.isError && count === 0;
  return (
    <section
      ref={sectionRef}
      className={empty ? "hidden" : "space-y-3"}
    >
      <RowHeader
        label={label}
        isFetching={nudge.isFetching}
        onRefresh={refreshable ? nudge.triggerRefresh : undefined}
        action={action}
      />
      {loading ? (
        <Slider>
          {skeleton}
          {skeleton}
        </Slider>
      ) : nudge.isError ? (
        <ErrorMessage
          what={label.toLowerCase()}
          onRetry={nudge.retry}
        />
      ) : empty ? null : (
        <Slider>{children}</Slider>
      )}
    </section>
  );
}

/** Fixed 270-wide cards 12px apart — Home's news carousel treatment. */
function Slider({ children }: { children: ReactNode }) {
  return (
    <div className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
      {children}
    </div>
  );
}

/** Row label with the regenerate control the old nudge accordions had. */
function RowHeader({
  label,
  isFetching,
  onRefresh,
  action,
}: {
  label: string;
  isFetching: boolean;
  onRefresh?: () => void;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <RowLabel>{label}</RowLabel>
      <div className="flex items-center gap-1">
        {action}
        {onRefresh && (
          <RefreshButton
            label={label}
            isFetching={isFetching}
            onRefresh={onRefresh}
          />
        )}
      </div>
    </div>
  );
}

function RefreshButton({
  label,
  isFetching,
  onRefresh,
}: {
  label: string;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  return (
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
  );
}

function ErrorMessage({
  what,
  onRetry,
}: {
  what: string;
  onRetry: () => void;
}) {
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
    <div className="glass-card premium-shadow-sm rounded-card flex items-start gap-3.5 p-5">
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
