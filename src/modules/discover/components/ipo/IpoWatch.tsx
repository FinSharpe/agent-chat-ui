"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CalendarX, CloudOff, Rocket } from "lucide-react";
import FeatureHeader from "@/components/discover/FeatureHeader";
import SoftLoader from "@/components/SoftLoader";
import { PopupFrame } from "@/components/shared/Popup";
import { BANNER_WAVE, SectionBanner } from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import type { IpoIssue } from "../../api/ipo";
import { useIpoCalendar } from "../../hooks/useIpoCalendar";
import { ipoBannerTitle } from "../../utils/banner-titles";
import { type IpoWindowState, windowStateAt } from "../../utils/ipo-window";
import { FeatureEmptyState, RetryErrorState } from "../shared/FeatureStates";
import { Caveat, SectionHead } from "../shared/FeedKit";
import { IpoInsightView } from "./IpoInsightView";
import { IpoIssueCard } from "./IpoIssueCard";

/**
 * IPO Watch — the live primary-market calendar (T-07), ported from
 * finsharpe-mobile's `IpoListScreen`. Public market data, grouped by where
 * each bidding window stands.
 *
 * Three states are kept apart on purpose, because collapsing any two of them
 * tells the reader something untrue: a **failed feed** says the calendar could
 * not be read and offers a retry; an **empty calendar** is a claim about the
 * market and is only ever made on a response that arrived; a **loading**
 * calendar says neither.
 */

/** Sections in reading order: what you can act on, then plan for, then what the feed could not date, then what you missed. */
const GROUPS: [IpoWindowState, string][] = [
  ["open", "Open now"],
  ["upcoming", "Opening soon"],
  ["unknown", "Dates to be confirmed"],
  ["closed", "Recently closed"],
];

/** The issues in one window state, soonest deadline first, nulls last. */
function inState(issues: IpoIssue[], state: IpoWindowState, now: Date) {
  const rows = issues.filter(
    (issue) => windowStateAt(issue.biddingWindow, now) === state,
  );
  const key = (issue: IpoIssue) =>
    state === "upcoming"
      ? issue.biddingWindow.opensAt
      : issue.biddingWindow.closesAt;
  return rows.sort((a, b) => {
    const left = key(a);
    const right = key(b);
    if (!left || !right) return left ? -1 : right ? 1 : 0;
    return left.getTime() - right.getTime();
  });
}

export function IpoWatch({
  onBack,
  selectedFincode,
  onSelect,
  onCloseDetail,
}: {
  onBack: () => void;
  selectedFincode: number | null;
  onSelect: (fincode: number) => void;
  onCloseDetail: () => void;
}) {
  const isDesktopWeb = useIsDesktopWeb();
  const { data, isError, isPending, refetch } = useIpoCalendar();

  // One instant for the whole list, taken as it first builds, so every
  // countdown on screen agrees with every other.
  const [now] = useState(() => new Date());

  const groups = useMemo(
    () =>
      GROUPS.map(([state, heading]) => ({
        heading,
        rows: inState(data?.issues ?? [], state, now),
      })).filter((group) => group.rows.length > 0),
    [data, now],
  );

  const detail =
    selectedFincode !== null ? (
      <IpoInsightView
        fincode={selectedFincode}
        onBack={onCloseDetail}
      />
    ) : null;
  if (detail && !isDesktopWeb) return detail;

  let body: React.ReactNode;
  if (isError) {
    body = (
      <RetryErrorState
        icon={<Rocket size={22} />}
        title="Could not load the IPO calendar"
        message="The IPO calendar could not be read just now. This is the feed failing, not an empty week."
        onRetry={() => refetch()}
      />
    );
  } else if (isPending) {
    body = (
      <SoftLoader
        variant="wave"
        message="Loading the calendar"
      />
    );
  } else if (data.issues.length === 0) {
    body = (
      <FeatureEmptyState
        icon={<CalendarX size={22} />}
        title="No issues are open right now"
        message="The primary market has nothing open or opening today. New issues appear here as soon as their dates are announced."
        actionLabel="Back to Discover"
        onAction={onBack}
      />
    );
  } else {
    body = (
      <div
        className={`scrollbar-none flex-1 space-y-12 overflow-y-auto px-5 py-5 ${isDesktopWeb ? "pb-16" : "pb-[130px]"}`}
      >
        <SectionBanner
          eyebrow="Primary market"
          title={ipoBannerTitle(data.issues, now)}
          tone="mint"
          height={260}
          image={BANNER_WAVE.teal}
          imageScrim
        />

        {/* Said once at the top rather than under each row: the cause is one
            outage rather than ten issuers. */}
        {data.identifiersUnavailable && (
          <div className="glass-card rounded-card p-4.5">
            <Caveat icon={<CloudOff size={14} />}>
              The issuer lookup could not be reached, so the analysis behind
              these issues is unavailable for now. The dates and application
              figures below come from the exchange feed and are unaffected.
            </Caveat>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.heading}>
            <SectionHead
              title={group.heading}
              chip={String(group.rows.length)}
            />
            <div className="space-y-3">
              {group.rows.map((issue) => (
                <IpoIssueCard
                  key={`${issue.symbol}-${issue.identifiers.fincode ?? "x"}`}
                  issue={issue}
                  now={now}
                  identifiersUnavailable={data.identifiersUnavailable}
                  onOpen={onSelect}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      {isDesktopWeb && (
        <AnimatePresence>
          {detail && <PopupFrame onClose={onCloseDetail}>{detail}</PopupFrame>}
        </AnimatePresence>
      )}
      <FeatureHeader
        title="IPO Watch"
        subtitle="Open & upcoming issues"
        onBack={onBack}
      />
      {body}
    </div>
  );
}
