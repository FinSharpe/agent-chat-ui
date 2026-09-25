"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import FeatureHeader from "@/components/discover/FeatureHeader";
import SectionErrorState from "@/components/shared/SectionErrorState";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
// The routes file, not the pipelines barrel: the barrel pulls in every
// research screen.
import { researchRoutes } from "@/modules/pipelines/constants/routes";

import {
  BALANCE_ERROR_TITLE,
  CREDITS_TITLE,
  HISTORY_ERROR_TITLE,
  HISTORY_LABEL,
  OLDER_ERROR_TITLE,
} from "../constants/copy";
import {
  useCreditBalance,
  useCreditHistory,
  useCreditRequestHref,
} from "../hooks/useCredits";
import { useThreadTitles } from "../hooks/useThreadTitles";
import {
  historyEntries,
  historyRowView,
  type HistoryTarget,
} from "../utils/history";
import {
  balanceSection,
  historySection,
  olderControl,
} from "../utils/sections";
import { BalanceHeadline, BalanceSkeleton, Eyebrow } from "./BalanceHeadline";
import {
  HistoryEmpty,
  HistoryList,
  HistorySkeleton,
  ShowOlderButton,
} from "./HistoryList";
import { RequestCreditsButton } from "./RequestCreditsButton";

/**
 * The Credits page — the web's Credits screen (plan Phase 7; #231 decision 9):
 * the `/settings/mcp` page pattern, cut A · Statement. The Balance headline
 * uncarded, then the History in one glass list card, "Show older" for the
 * cursor.
 *
 * Both reads refetch whenever this page opens. A read that fails says so in
 * place and never renders as zero or as an empty History — "we could not
 * load it" is not "you have none".
 */
export function CreditsPage() {
  const router = useRouter();
  const isDesktopWeb = useIsDesktopWeb();
  const { openThread } = useAppNavigation();

  const balance = useCreditBalance();
  const history = useCreditHistory();
  const threadTitles = useThreadTitles();
  const requestHref = useCreditRequestHref(balance.data?.balance_minor);

  const rows = useMemo(() => {
    const now = new Date();
    return historyEntries(history.data?.pages).map((entry, index) =>
      historyRowView(entry, { threadTitles, now, index }),
    );
  }, [history.data, threadTitles]);

  const balanceState = balanceSection(balance);
  const historyState = historySection(history, rows.length);
  const older = olderControl(history);

  const open = (target: NonNullable<HistoryTarget>) => {
    if (target.kind === "thread") openThread(target.threadId);
    else router.push(researchRoutes.report(target.runId));
  };

  // Back returns to wherever the page was opened from; a direct visit has
  // nothing to go back to inside the app, so it lands on Chat instead.
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  const body = (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      <FeatureHeader
        title={CREDITS_TITLE}
        onBack={goBack}
      />
      <div
        className={`scrollbar-none flex-1 space-y-7 overflow-y-auto px-5 py-6 ${isDesktopWeb ? "pb-16" : "pb-[130px]"}`}
      >
        {balanceState === "ready" && balance.data ? (
          <BalanceHeadline
            credits={balance.data}
            requestHref={requestHref}
          />
        ) : balanceState === "loading" ? (
          <BalanceSkeleton />
        ) : (
          <div className="flex flex-col gap-3">
            <SectionErrorState
              compact
              title={BALANCE_ERROR_TITLE}
              onRetry={() => balance.refetch()}
              retrying={balance.isFetching}
            />
            {/* The request is offered at any Balance — including one we
                could not read. Its message then leaves the Balance out. */}
            <RequestCreditsButton href={requestHref} />
          </div>
        )}

        <section
          aria-label={HISTORY_LABEL}
          className="flex flex-col gap-3"
        >
          <Eyebrow>{HISTORY_LABEL}</Eyebrow>
          {historyState === "loading" ? (
            <HistorySkeleton />
          ) : historyState === "error" ? (
            <SectionErrorState
              className="glass-card rounded-card"
              title={HISTORY_ERROR_TITLE}
              onRetry={() => history.refetch()}
              retrying={history.isFetching}
            />
          ) : historyState === "empty" ? (
            <HistoryEmpty />
          ) : (
            <>
              <HistoryList
                rows={rows}
                onOpen={open}
              />
              {older === "error" ? (
                <SectionErrorState
                  compact
                  title={OLDER_ERROR_TITLE}
                  onRetry={() => history.fetchNextPage()}
                  retrying={history.isFetchingNextPage}
                />
              ) : (
                older === "more" && (
                  <ShowOlderButton
                    loading={history.isFetchingNextPage}
                    onClick={() => history.fetchNextPage()}
                  />
                )
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );

  return (
    <div className="font-funnel relative h-full w-full flex-1 overflow-hidden bg-transparent">
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22 }}
        className="absolute inset-0 flex flex-col"
      >
        {isDesktopWeb ? (
          <div className="mx-auto flex h-full min-h-0 w-full max-w-[calc(804px*var(--wx,1))] flex-col">
            {body}
          </div>
        ) : (
          body
        )}
      </motion.div>
    </div>
  );
}
