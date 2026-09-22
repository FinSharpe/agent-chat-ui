"use client";

import { ExternalLink, FileText, PenLine } from "lucide-react";
import type {
  IpoCitation,
  IpoInsight,
  IpoInsightClaim,
} from "../../api/ipo";
import { shortDate } from "../../utils/relative-time";
import { Caveat, SkeletonBlock, StatusChip } from "../shared/FeedKit";
import { Card, CardTitle } from "./IpoInsightCards";

/* "What the prospectus says" — the one block on the analysis with a state.
   Three mutually exclusive answers off `insight.status`, and the trust
   surface of the whole feature: every document-sourced claim names its page
   and opens the issuer's own archived PDF there. */

/** "RHP p.87" — the page a claim came from, and the way to the document. */
function CitationChip({
  citation,
  stageLabel,
}: {
  citation: IpoCitation;
  stageLabel: string;
}) {
  const label = citation.page == null ? stageLabel : `${stageLabel} p.${citation.page}`;
  const chip = (
    <span className="tone-blue inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
      {label}
      {citation.documentUrl && <ExternalLink size={10} />}
    </span>
  );
  // A citation with no document to open still renders, un-inked: the page
  // reference is worth stating, and a chip that led nowhere while looking like
  // a link would be worse than one that plainly does not.
  if (!citation.documentUrl) return chip;
  return (
    <a
      href={citation.documentUrl}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-block"
    >
      {chip}
    </a>
  );
}

/** One line of a section: what the document says, and whether it counted. */
function ClaimTile({
  claim,
  stageLabel,
}: {
  claim: IpoInsightClaim;
  stageLabel: string;
}) {
  const value = [claim.valueText, claim.unitText].filter(Boolean).join(" ");
  return (
    <div className="space-y-2">
      {claim.isProse ? (
        <p className="text-[11px] leading-relaxed text-slate-500">{claim.text}</p>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <span className="text-[11px] text-slate-500">{claim.label}</span>
          <span
            className={`text-right text-[12px] tabular-nums ${claim.usable ? "font-geist font-medium text-[#0A1F4D]" : "text-slate-400"}`}
          >
            {value || claim.text}
          </span>
        </div>
      )}
      {/* A figure the gate discarded is still shown — quoting a document is a
          lower bar than computing from it — and this is what keeps the two
          apart. */}
      {!claim.usable && claim.verdict && !claim.isProse && (
        <StatusChip
          label={`Not used · ${claim.verdict}`}
          tone="warning"
        />
      )}
      {claim.quote && (
        <p className="rounded-r-nested border-l-2 border-[#063BAA] bg-[#063BAA]/6 px-3 py-2 text-[10px] leading-relaxed text-slate-500">
          {claim.quote}
        </p>
      )}
      <CitationChip
        citation={claim.citation}
        stageLabel={stageLabel}
      />
    </div>
  );
}

/**
 * One of the prospectus sections. Rendered even with no claims: its emptiness
 * is the answer for that question, and dropping the heading would make a
 * document that simply said less look like a different product.
 */
function SectionCard({
  section,
  stageLabel,
}: {
  section: IpoInsight["sections"][number];
  stageLabel: string;
}) {
  return (
    <Card>
      <CardTitle>{section.title}</CardTitle>
      {section.detail && (
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          {section.detail}
        </p>
      )}
      {section.claims.length === 0 ? (
        <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
          The passages retrieved from this prospectus carried nothing under this
          heading.
        </p>
      ) : (
        <div className="mt-3 divide-y divide-slate-100">
          {section.claims.map((claim, i) => (
            <div
              key={`${claim.label}-${i}`}
              className="py-3 first:pt-0 last:pb-0"
            >
              <ClaimTile
                claim={claim}
                stageLabel={stageLabel}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

const UNAVAILABLE_TITLES: Record<string, string> = {
  no_rhp: "No prospectus indexed yet",
  draft_only: "Only a draft prospectus exists",
  no_coverage: "This issuer is not in our research universe",
};

/**
 * The whole prospectus block, in whichever of its three states this is.
 *
 * The editorial summary, when there is one, comes first in every state: it is
 * a summary of the document by a person, so it goes above whatever the machine
 * has to say.
 */
export function IpoProspectusBlock({ insight }: { insight: IpoInsight }) {
  const { stageLabel, editorialSummary: editorial } = insight;

  const summaryCard = editorial && (
    <Card>
      <CardTitle>Summary of the prospectus</CardTitle>
      <div className="mt-3 divide-y divide-slate-100">
        {editorial.sections.map((section) => (
          <div
            key={section.title}
            className="py-3 first:pt-0 last:pb-0"
          >
            <p className="text-[11px] font-medium text-[#0A1F4D]">{section.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              {section.body}
            </p>
          </div>
        ))}
      </div>
      {editorial.attribution && (
        <div className="mt-3">
          <Caveat icon={<PenLine size={12} />}>{editorial.attribution}</Caveat>
        </div>
      )}
      {editorial.rhpUrl && (
        <a
          href={editorial.rhpUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="hover-tint mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#063BAA]/8 px-4 py-2 text-[11px] font-medium text-[#063BAA] transition-colors"
        >
          <ExternalLink size={12} /> Read the full prospectus
        </a>
      )}
    </Card>
  );

  if (insight.status === "generating") {
    return (
      <div className="space-y-3">
        {summaryCard}
        <Card>
          <StatusChip
            label="Being written now"
            tone="info"
          />
          {insight.detail && (
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              {insight.detail}
            </p>
          )}
          <div className="mt-4 space-y-2">
            <SkeletonBlock
              width={150}
              height={12}
            />
            <SkeletonBlock height={9} />
            <SkeletonBlock height={9} />
            <SkeletonBlock
              width={210}
              height={9}
            />
          </div>
          <p className="mt-4 text-[10px] text-slate-400">
            Checking again in a few seconds.
          </p>
        </Card>
      </div>
    );
  }

  if (insight.status === "unavailable") {
    // "No prospectus indexed yet" answers a question the editorial summary has
    // already answered, so for that reason and the draft-only one the card
    // steps aside.
    const answered =
      insight.reason === "no_rhp" || insight.reason === "draft_only";
    return (
      <div className="space-y-3">
        {summaryCard}
        {(!editorial || !answered) && (
          <Card>
            <CardTitle>
              {UNAVAILABLE_TITLES[insight.reason ?? ""] ??
                "We could not check for a prospectus"}
            </CardTitle>
            {insight.detail && (
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                {insight.detail}
              </p>
            )}
          </Card>
        )}
      </div>
    );
  }

  // Which document was read and when — so a stored analysis is never mistaken
  // for something computed live off today's market.
  const provenance = insight.hasProspectusDocument
    ? `${insight.readAt ? `Read once from the ${stageLabel} on ${shortDate(insight.readAt)}` : `Read once from the ${stageLabel}`}, and stored. Every claim above opens the document it came from, at the page it came from.`
    : null;
  return (
    <div className="space-y-3">
      {summaryCard}
      {(insight.citations.length > 0 || insight.documentProse) && (
        <Card>
          <CardTitle>What the document says</CardTitle>
          {insight.citations.length === 0 ? (
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              {insight.documentProse}
            </p>
          ) : (
            <div className="mt-3 divide-y divide-slate-100">
              {insight.citations.map((cited, i) => (
                <div
                  key={`${cited.claim}-${i}`}
                  className="space-y-2 py-3 first:pt-0 last:pb-0"
                >
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    {cited.claim}
                  </p>
                  <CitationChip
                    citation={cited.citation}
                    stageLabel={stageLabel}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
      {insight.sections.map((section) => (
        <SectionCard
          key={section.key || section.title}
          section={section}
          stageLabel={stageLabel}
        />
      ))}
      {provenance && (
        <div className="px-1">
          <Caveat icon={<FileText size={12} />}>{provenance}</Caveat>
        </div>
      )}
    </div>
  );
}
