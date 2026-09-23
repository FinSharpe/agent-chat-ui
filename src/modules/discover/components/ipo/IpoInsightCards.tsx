"use client";

import { useState } from "react";
import { History, Info } from "lucide-react";
import type { IpoInsight, IpoIssue } from "../../api/ipo";
import {
  crLabel,
  formatIndianInt,
  formatInr,
  multipleLabel,
  pctLabel,
  signedPctLabel,
} from "../../utils/inr";
import { shortDate } from "../../utils/relative-time";
import { windowDatesLabel } from "../../utils/ipo-window";
import { NumericTable, StatGrid, StatTile } from "../shared/DataGrid";
import {
  CardDivider,
  Caveat,
  ChipTone,
  CountChip,
  Fact,
  StatusChip,
} from "../shared/FeedKit";

/* The deterministic blocks of one issue's analysis. Nothing here decides
   anything: every verdict was reached server-side and every sentence is the
   backend's own prose. These components choose tone and placement, never
   wording. */

export const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="glass-card rounded-card p-5">{children}</div>
);

export const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="font-geist text-[13px] font-medium text-[#0A1F4D]">{children}</h4>
);

const BADGE_TONES: Record<string, ChipTone> = {
  positive: "positive",
  negative: "negative",
  warning: "warning",
  info: "info",
  neutral: "neutral",
};

const AXIS_CAPTIONS: Record<string, string> = {
  valuation: "A claim about valuation",
  structure: "A claim about the offer's structure",
};

const Multiple = ({ caption, value }: { caption: string; value: number | null }) => (
  <StatTile
    caption={caption}
    value={multipleLabel(value)}
    muted={value == null}
  />
);

/**
 * The page's thesis, and the one block present in every state: a verdict needs
 * no prospectus, so an issue whose document has not been read still leads with
 * what it is asking against what its peers are worth.
 */
export function IpoVerdictCard({ insight }: { insight: IpoInsight }) {
  const { badge, verdict } = insight;
  const axisCaption = badge ? AXIS_CAPTIONS[badge.axis] : undefined;

  return (
    <Card>
      {badge ? (
        <>
          <StatusChip
            label={badge.label}
            tone={BADGE_TONES[badge.tone] ?? "neutral"}
          />
          {axisCaption && (
            <p className="mt-2 text-[9px] font-medium tracking-wider text-slate-400 uppercase">
              {axisCaption}
            </p>
          )}
        </>
      ) : (
        <p className="text-[9px] font-medium tracking-wider text-slate-400 uppercase">
          No verdict taken
        </p>
      )}

      {insight.pricingLine && (
        <p className="mt-3 text-[12px] leading-relaxed text-[#0A1F4D]">
          {insight.pricingLine}
        </p>
      )}
      {verdict && (
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          {verdict.detail}
        </p>
      )}

      <CardDivider />

      <StatGrid>
        <Multiple
          caption="Floor P/E"
          value={insight.peFloor}
        />
        <Multiple
          caption="Post-money P/E"
          value={insight.pePostmoney}
        />
        <Multiple
          caption="Peer P/E median"
          value={insight.peerMedian}
        />
      </StatGrid>

      {insight.valuationNotes.length > 0 && (
        <div className="mt-3 space-y-2">
          {insight.valuationNotes.map((note) => (
            <Caveat
              key={note}
              icon={<Info size={12} />}
            >
              {note}
            </Caveat>
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * What was said while the book was open — the only verdict an issue the feed
 * has forgotten can honestly carry. Dated, and never re-toned: the thresholds
 * behind the label are placeholders, and a colour would give a provisional
 * rule the weight of a settled one.
 */
export function IpoVerdictAtBiddingCard({
  verdict,
}: {
  verdict: NonNullable<IpoInsight["verdictAtBidding"]>;
}) {
  return (
    <Card>
      <p className="text-[9px] font-medium tracking-wider text-slate-400 uppercase">
        {verdict.biddingEnd
          ? `While the book was open, to ${shortDate(verdict.biddingEnd)}`
          : "While the book was open"}
      </p>
      {verdict.badge && (
        <div className="mt-2">
          <StatusChip label={verdict.badge} />
        </div>
      )}
      <div className="mt-3">
        <StatGrid>
          <Multiple
            caption="Floor P/E"
            value={verdict.peFloor}
          />
          <Multiple
            caption="Post-money P/E"
            value={verdict.pePostmoney}
          />
          <Multiple
            caption="Peer P/E median"
            value={verdict.peerMedian}
          />
          {verdict.bandTop != null && (
            <StatTile
              caption="Band top"
              value={formatInr(verdict.bandTop)}
            />
          )}
        </StatGrid>
      </div>
      <div className="mt-3">
        <Caveat icon={<History size={12} />}>
          The exchange feed forgets an issue once bidding closes, so this is the
          record of how it was priced at the time. Nothing here is recomputed
          against today.
        </Caveat>
      </div>
    </Card>
  );
}

/** Price band, lot, minimum application and the window — off the calendar row. */
export function IpoCostCard({ issue }: { issue: IpoIssue }) {
  const { application, priceBand } = issue;
  const dates = windowDatesLabel(issue.biddingWindow);
  const low = priceBand.minInr;
  const high = priceBand.maxInr;
  const band =
    low == null && high == null
      ? "—"
      : low == null || high == null
        ? formatInr((low ?? high)!)
        : priceBand.isFixedPrice || low === high
          ? formatInr(low)
          : `${formatInr(low)} – ${formatInr(high)}`;

  const sub =
    application.minShares == null
      ? null
      : application.minSharesNotWholeLots ||
          application.minLots == null ||
          application.minLots < 1
        ? `${formatIndianInt(application.minShares)} shares`
        : `${application.minLots === 1 ? "1 lot" : `${application.minLots} lots`}  ·  ${formatIndianInt(application.minShares)} shares`;

  return (
    <Card>
      <div className="space-y-2">
        <Fact
          label="Price band"
          value={band}
        />
        <Fact
          label="Lot size"
          value={
            application.lotSizeShares == null
              ? "—"
              : `${formatIndianInt(application.lotSizeShares)} shares`
          }
        />
        <Fact
          label="Minimum application"
          value={
            application.minApplicationInr == null
              ? "—"
              : formatInr(application.minApplicationInr)
          }
          sub={sub}
          strong
        />
        {priceBand.cutOffAssumed && (
          <Caveat icon={<Info size={12} />}>
            The vendor sent no cut-off price, so these rupee figures use the top
            of the band.
          </Caveat>
        )}
        {dates && (
          <Fact
            label="Bidding window"
            value={dates}
          />
        )}
      </div>
    </Card>
  );
}

/** The issuer's filed profit and loss, or the reason there is none. */
export function IpoFinancialsCard({
  panel,
}: {
  panel: IpoInsight["financials"];
}) {
  if (panel.years.length === 0) {
    return (
      <Card>
        <p className="text-[11px] leading-relaxed text-slate-500">
          {panel.detail ?? "No filed profit and loss is available yet."}
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <NumericTable
        columns={["Year", "Net sales", "PAT", "EPS"]}
        rows={panel.years.map((year) => [
          year.fiscalYear ?? "—",
          crLabel(year.netSalesCr),
          crLabel(year.profitAfterTaxCr),
          crLabel(year.adjEpsInr),
        ])}
        negativeRow={panel.years.map(
          (year) => (year.profitAfterTaxCr ?? 0) < 0 || (year.adjEpsInr ?? 0) < 0,
        )}
      />
      {(panel.salesCagr3yPct != null || panel.patCagr3yPct != null) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {panel.salesCagr3yPct != null && (
            <CountChip label={`Sales 3y  ${signedPctLabel(panel.salesCagr3yPct)}`} />
          )}
          {panel.patCagr3yPct != null && (
            <CountChip label={`Profit 3y  ${signedPctLabel(panel.patCagr3yPct)}`} />
          )}
        </div>
      )}
      {panel.provenance && (
        <div className="mt-3">
          <Caveat icon={<Info size={12} />}>{panel.provenance}</Caveat>
        </div>
      )}
    </Card>
  );
}

/** What the market pays for comparable listed businesses. */
export function IpoPeersCard({ panel }: { panel: IpoInsight["peers"] }) {
  if (panel.peers.length === 0) {
    return (
      <Card>
        <p className="text-[11px] leading-relaxed text-slate-500">
          {panel.detail ?? "No listed comparables could be drawn for this issuer."}
        </p>
      </Card>
    );
  }

  return (
    <Card>
      {/* "Median P/E", not "Peer P/E median": the verdict card already carries
          that exact caption, and the same words twice on one page read as the
          same figure repeated. */}
      <Fact
        label="Median P/E"
        value={multipleLabel(panel.peerPeMedian)}
        sub={`over ${panel.count} listed comparables`}
        strong
      />
      <CardDivider />
      <NumericTable
        columns={["Peer", "P/E", "ROE 3y", "Sales 3y"]}
        rows={panel.peers.map((peer) => [
          peer.symbol ?? peer.name ?? "—",
          multipleLabel(peer.pe),
          pctLabel(peer.roe3yAvgPct),
          pctLabel(peer.salesCagr3yPct),
        ])}
      />
      {panel.issuerPeNote && (
        <div className="mt-3">
          <Caveat icon={<Info size={12} />}>{panel.issuerPeNote}</Caveat>
        </div>
      )}
    </Card>
  );
}

/**
 * Third-party headlines, labelled as what they are and **collapsed by
 * default**: several of them shout a listing-gain percentage off a rumour,
 * and this page makes no forecast of its own.
 */
export function IpoHeadlinesCard({ panel }: { panel: IpoInsight["news"] }) {
  const [open, setOpen] = useState(false);

  if (panel.headlines.length === 0) {
    return (
      <Card>
        <p className="text-[11px] leading-relaxed text-slate-500">
          {panel.detail ?? "No headlines naming this issuer were found."}
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <StatusChip
        label="Unofficial · not exchange data"
        tone="warning"
      />
      {panel.note && (
        <p className="mt-3 text-[10px] leading-relaxed text-slate-400">{panel.note}</p>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="hover-tint mt-4 rounded-full bg-[#063BAA]/8 px-4 py-2 text-[11px] font-medium text-[#063BAA] transition-colors"
      >
        {open ? "Hide headlines" : `Show ${panel.headlines.length} headlines`}
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          {panel.headlines.map((headline, i) => (
            <div key={`${headline.title}-${i}`}>
              <div className="flex flex-wrap items-center gap-2">
                {headline.date && (
                  <span className="text-[10px] text-slate-400">
                    {shortDate(headline.date)}
                  </span>
                )}
                {headline.chatter.map((label) => (
                  <StatusChip
                    key={label}
                    label={label}
                    tone="warning"
                  />
                ))}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                {headline.title}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
