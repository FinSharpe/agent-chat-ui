"use client";

import { Rocket } from "lucide-react";
import FeatureHeader from "@/components/discover/FeatureHeader";
import SoftLoader from "@/components/SoftLoader";
import { useIpoInsight } from "../../hooks/useIpoCalendar";
import { RetryErrorState } from "../shared/FeatureStates";
import { SectionHead } from "../shared/FeedKit";
import {
  IpoCostCard,
  IpoFinancialsCard,
  IpoHeadlinesCard,
  IpoPeersCard,
  IpoVerdictAtBiddingCard,
  IpoVerdictCard,
} from "./IpoInsightCards";
import { IpoProspectusBlock } from "./IpoProspectus";

/**
 * One issue's analysis (T-07), reached by a tap on any IPO Watch row that has
 * a fincode and addressed by that fincode alone — prospectus chunks store an
 * empty symbol for SME issuers, which is most of the calendar.
 *
 * The page is built so that no single absence empties it: the verdict, the lot
 * economics, the financial trend and the peer table each stand on their own,
 * and the prospectus half — the only part that can be missing, refused or
 * still being written — is one block among them.
 *
 * Reading order is the reader's decision order: the thesis, whether the issue
 * is within reach, the thing they tapped for, then the evidence, then the
 * chatter.
 */

/** The standing statement of what this page is not, verbatim from finsharpe-mobile. */
const NO_FORECAST =
  "FinSharpe is a SEBI Registered Investment Adviser. This page prices an " +
  "issue against listed peers and reports what its prospectus states. It " +
  "carries no price target and no listing-gain estimate. Not investment " +
  "advice.";

const FALLBACK_TITLE = "Issue analysis";

export function IpoInsightView({
  fincode,
  onBack,
}: {
  fincode: number;
  onBack: () => void;
}) {
  const { data: insight, isError, isPending, refetch } = useIpoInsight(fincode);
  const issuer = insight?.issuerLabel ?? null;

  let body: React.ReactNode;
  if (isError) {
    body = (
      <RetryErrorState
        icon={<Rocket size={22} />}
        title="Could not load this analysis"
        message="The analysis for this issue could not be read just now. This is the lookup failing, not an issue with nothing to say."
        onRetry={() => refetch()}
      />
    );
  } else if (isPending) {
    body = (
      <SoftLoader
        variant="wave"
        message="Loading the analysis"
      />
    );
  } else {
    const { issue, news } = insight;
    body = (
      <div className="scrollbar-none flex-1 space-y-6 overflow-y-auto px-5 pt-3 pb-10">
        {insight.hasLiveVerdict ? (
          <IpoVerdictCard insight={insight} />
        ) : (
          insight.verdictAtBidding && (
            <IpoVerdictAtBiddingCard verdict={insight.verdictAtBidding} />
          )
        )}

        {issue && (
          <section>
            <SectionHead title="What applying costs" />
            <IpoCostCard issue={issue} />
          </section>
        )}

        <section>
          <SectionHead title="What the prospectus says" />
          <IpoProspectusBlock insight={insight} />
        </section>

        <section>
          <SectionHead title="The financial trend" />
          <IpoFinancialsCard panel={insight.financials} />
        </section>

        <section>
          <SectionHead
            title="Listed peers"
            chip={
              insight.peers.peers.length ? String(insight.peers.count) : null
            }
          />
          <IpoPeersCard panel={insight.peers} />
        </section>

        {/* Kept even when empty so the section says why rather than vanishing —
            but only for an issue the calendar still carries. */}
        {(news.headlines.length > 0 || (issue && news.detail)) && (
          <section>
            <SectionHead
              title="Headlines"
              chip={news.headlines.length ? String(news.count) : null}
            />
            <IpoHeadlinesCard panel={news} />
          </section>
        )}

        <p className="px-1 pt-4 text-[10px] leading-relaxed text-slate-400">
          {NO_FORECAST}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      <FeatureHeader
        title={issuer ?? FALLBACK_TITLE}
        subtitle={issuer ? FALLBACK_TITLE : undefined}
        onBack={onBack}
      />
      {body}
    </div>
  );
}
