import { getJson } from "./client";

/**
 * `GET /api/ipo/issues` — the primary-market calendar behind IPO Watch,
 * ported from finsharpe-mobile `lib/features/ipo/data/ipo_api.dart`.
 *
 * Two rules the screens depend on:
 * - **An empty list is a real market claim, never an error fallback.** A feed
 *   that did not answer throws; only a response that arrived may say "nothing
 *   is open".
 * - **There is no GMP field, and no window state on the wire.** The backend's
 *   response is cached, so anything clock-derived in it would be served stale;
 *   the window is computed client-side in `utils/ipo-window.ts`.
 */

const num = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const str = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;
const date = (value: unknown): Date | null => {
  const raw = str(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const obj = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export interface IpoPriceBand {
  minInr: number | null;
  maxInr: number | null;
  cutOffInr: number | null;
  isFixedPrice: boolean;
  /** The vendor sent no cut-off, so every rupee figure uses the band top. */
  cutOffAssumed: boolean;
}

export interface IpoBiddingWindow {
  opensAt: Date | null;
  closesAt: Date | null;
  /** The vendor sent a date with no time; the backend filled the hour in. */
  timesAssumed: boolean;
}

export interface IpoApplication {
  lotSizeShares: number | null;
  minLots: number | null;
  minShares: number | null;
  minApplicationInr: number | null;
  minSharesNotWholeLots: boolean;
}

export interface IpoIdentifiers {
  /** Radar's issuer key, and the only address the insight endpoint has. */
  fincode: number | null;
  radarCompanyName: string | null;
}

export interface IpoIssue {
  symbol: string;
  name: string | null;
  exchanges: string[];
  priceBand: IpoPriceBand;
  biddingWindow: IpoBiddingWindow;
  application: IpoApplication;
  identifiers: IpoIdentifiers;
  rhpUrl: string | null;
  /**
   * What to call the issuer on screen. Radar's registered name first: the
   * vendor spells one company `LUMINO INDUSTRIES LIMITED` and another
   * `ESDS Software Solution Limited` in the same response, and a list where
   * half the rows shout reads as broken.
   */
  issuer: string;
}

export interface IpoCalendar {
  issues: IpoIssue[];
  /**
   * Radar's listing **could not be read** — different words from "Radar does
   * not carry this issuer". Every fincode on the calendar is null for that
   * one reason, so the sentence on screen is "we could not check".
   */
  identifiersUnavailable: boolean;
}

export function parseIpoIssue(raw: unknown): IpoIssue {
  const j = obj(raw);
  const band = obj(j.priceBand);
  const window = obj(j.biddingWindow);
  const application = obj(j.application);
  const identifiers = obj(j.identifiers);

  const symbol = str(j.symbol) ?? "";
  const name = str(j.name);
  const radarName = str(identifiers.radarCompanyName);

  return {
    symbol,
    name,
    exchanges: arr(j.exchanges).map(String),
    priceBand: {
      minInr: num(band.minInr),
      maxInr: num(band.maxInr),
      cutOffInr: num(band.cutOffInr),
      isFixedPrice: band.isFixedPrice === true,
      cutOffAssumed: band.cutOffAssumed === true,
    },
    biddingWindow: {
      opensAt: date(window.opensAt),
      closesAt: date(window.closesAt),
      timesAssumed: window.timesAssumed === true,
    },
    application: {
      lotSizeShares: num(application.lotSizeShares),
      minLots: num(application.minLots),
      minShares: num(application.minShares),
      minApplicationInr: num(application.minApplicationInr),
      minSharesNotWholeLots: application.minSharesNotWholeLots === true,
    },
    identifiers: {
      fincode: num(identifiers.fincode),
      radarCompanyName: radarName,
    },
    rhpUrl: str(j.rhpUrl),
    issuer: radarName ?? name ?? symbol,
  };
}

export async function fetchIpoCalendar(
  signal?: AbortSignal,
): Promise<IpoCalendar> {
  const body = await getJson<Record<string, unknown>>("ipo/issues", { signal });
  return {
    issues: arr(body.issues).map(parseIpoIssue),
    identifiersUnavailable: body.identifiersUnavailable === true,
  };
}

/* ------------------------------------------------------------- the insight */

/**
 * `GET /api/ipo/insights/{fincode}` — keyed by Radar fincode, never by symbol
 * (prospectus chunks store an empty symbol for SME issuers, which is most of
 * the calendar). Every figure below comes off the response; a missing field
 * renders an em dash and nothing is computed here.
 */

export type IpoInsightStatus = "ready" | "generating" | "unavailable";
export type IpoInsightReason =
  | "no_rhp"
  | "draft_only"
  | "no_coverage"
  | "corpus_unreadable"
  | "unknown";

export interface IpoCitation {
  page: number | null;
  /** The archived PDF, opened at the cited page. Null when nothing can be opened. */
  documentUrl: string | null;
}

export interface IpoInsightClaim {
  label: string;
  text: string;
  valueText: string | null;
  unitText: string | null;
  quote: string | null;
  /** The gate's own word for why a figure was discarded. */
  verdict: string | null;
  usable: boolean;
  citation: IpoCitation;
  /** A risk factor, in the issuer's own words, rather than a label/value pair. */
  isProse: boolean;
}

export interface IpoInsightSection {
  key: string;
  title: string;
  detail: string | null;
  claims: IpoInsightClaim[];
}

export interface IpoFiscalYear {
  fiscalYear: string | null;
  netSalesCr: number | null;
  profitAfterTaxCr: number | null;
  adjEpsInr: number | null;
}

export interface IpoPeer {
  symbol: string | null;
  name: string | null;
  pe: number | null;
  roe3yAvgPct: number | null;
  salesCagr3yPct: number | null;
}

export interface IpoHeadline {
  date: Date | null;
  title: string;
  chatter: string[];
}

export interface IpoInsight {
  status: IpoInsightStatus;
  reason: IpoInsightReason | null;
  detail: string | null;
  issue: IpoIssue | null;
  badge: { label: string; tone: string; axis: string } | null;
  verdict: { detail: string } | null;
  pricingLine: string | null;
  peFloor: number | null;
  pePostmoney: number | null;
  peerMedian: number | null;
  /** A standing caveat per multiple actually shown, in tile order. */
  valuationNotes: string[];
  financials: {
    years: IpoFiscalYear[];
    salesCagr3yPct: number | null;
    patCagr3yPct: number | null;
    provenance: string | null;
    detail: string | null;
  };
  peers: {
    count: number;
    peerPeMedian: number | null;
    issuerPeNote: string | null;
    peers: IpoPeer[];
    detail: string | null;
  };
  news: {
    count: number;
    headlines: IpoHeadline[];
    note: string | null;
    detail: string | null;
  };
  sections: IpoInsightSection[];
  citations: { claim: string; citation: IpoCitation }[];
  documentProse: string | null;
  /** How the document names itself — "RHP". */
  stageLabel: string;
  /** Whether a stored prospectus reading stands behind the claims above. */
  hasProspectusDocument: boolean;
  /**
   * When the document was read, so a stored analysis is never mistaken for
   * something computed live off today's market. Never *by what*: naming a
   * model on a retail page tells a reader nothing they can act on.
   */
  readAt: Date | null;
  issuerLabel: string | null;
  hasLiveVerdict: boolean;
  editorialSummary: {
    sections: { title: string; body: string }[];
    attribution: string;
    rhpUrl: string | null;
  } | null;
  /** The record of how a closed issue was priced while its book was open. */
  verdictAtBidding: {
    badge: string | null;
    peFloor: number | null;
    pePostmoney: number | null;
    peerMedian: number | null;
    bandTop: number | null;
    biddingEnd: Date | null;
  } | null;
}

const REASONS: IpoInsightReason[] = [
  "no_rhp",
  "draft_only",
  "no_coverage",
  "corpus_unreadable",
];

function parseCitation(raw: unknown): IpoCitation {
  const j = obj(raw);
  const page = num(j.page);
  const url = str(j.sourceUrl);
  return {
    page: page === null ? null : Math.round(page),
    // A stored URL that already carries a fragment is left alone — the archive
    // pointed it somewhere deliberately.
    documentUrl: url
      ? page === null || url.includes("#")
        ? url
        : `${url}#page=${page}`
      : null,
  };
}

function parseClaim(raw: unknown): IpoInsightClaim {
  const j = obj(raw);
  const label = str(j.label) ?? "";
  return {
    label,
    text: str(j.text) ?? "",
    valueText: str(j.valueText),
    unitText: str(j.unitText),
    quote: str(j.quote),
    verdict: str(j.verdict),
    usable: j.usable === true,
    citation: parseCitation(j.citation),
    isProse: label === "",
  };
}

export function parseIpoInsight(raw: unknown): IpoInsight {
  const j = obj(raw);
  const panels = obj(j.panels);
  const financials = obj(panels.financials);
  const growth = obj(financials.growth);
  const valuation = obj(panels.valuationAtBand);
  const postMoney = obj(panels.postMoney);
  const peers = obj(panels.peers);
  const news = obj(panels.news);
  const badge = obj(j.badge);
  const verdict = obj(j.verdict);
  const stamped = j.verdictAtBidding ? obj(j.verdictAtBidding) : null;
  const document = obj(j.prospectus);
  const editorial = j.editorialSummary ? obj(j.editorialSummary) : null;

  const issue = j.issue ? parseIpoIssue(j.issue) : null;
  const rawReason = str(j.reason);
  const stage = str(document.stage);

  const peFloor = num(valuation.peAtBandTop) ?? num(verdict.peFloor);
  const pePostmoney = num(postMoney.peAtBandTop) ?? num(verdict.pePostmoney);

  // Only a basis that actually put a number on the page gets its caveat — a
  // note about a multiple nobody can see is noise.
  const valuationNotes = [
    peFloor === null ? null : str(valuation.note),
    pePostmoney === null ? null : str(postMoney.note),
    pePostmoney === null ? str(postMoney.detail) : null,
  ].filter((note): note is string => !!note);

  const provenance = [str(financials.source), str(financials.unit)]
    .filter(Boolean)
    .join("  ·  ");

  return {
    status:
      j.status === "ready"
        ? "ready"
        : j.status === "generating"
          ? "generating"
          : "unavailable",
    reason: rawReason
      ? (REASONS as string[]).includes(rawReason)
        ? (rawReason as IpoInsightReason)
        : "unknown"
      : null,
    detail: str(j.detail),
    issue,
    badge: str(badge.label)
      ? {
          label: str(badge.label)!,
          tone: str(badge.tone) ?? "neutral",
          axis: str(badge.axis) ?? "unknown",
        }
      : null,
    verdict: str(verdict.detail) ? { detail: str(verdict.detail)! } : null,
    pricingLine: str(j.pricingLine),
    peFloor,
    pePostmoney,
    peerMedian: num(verdict.peerMedian) ?? num(peers.peerPeMedian),
    valuationNotes,
    financials: {
      years: arr(financials.years).map((y) => {
        const year = obj(y);
        return {
          fiscalYear: str(year.fiscalYear),
          netSalesCr: num(year.netSalesCr),
          profitAfterTaxCr: num(year.profitAfterTaxCr),
          adjEpsInr: num(year.adjEpsInr),
        };
      }),
      salesCagr3yPct: num(growth.salesCagr3yPct),
      patCagr3yPct: num(growth.patCagr3yPct),
      provenance: provenance || null,
      detail: str(financials.detail),
    },
    peers: {
      count: num(peers.count) ?? 0,
      peerPeMedian: num(peers.peerPeMedian),
      issuerPeNote: str(peers.issuerPeNote),
      peers: arr(peers.peers).map((p) => {
        const peer = obj(p);
        return {
          symbol: str(peer.symbol),
          name: str(peer.name),
          pe: num(peer.pe),
          roe3yAvgPct: num(peer.roe3yAvgPct),
          salesCagr3yPct: num(peer.salesCagr3yPct),
        };
      }),
      detail: str(peers.detail),
    },
    news: {
      count: num(news.count) ?? 0,
      headlines: arr(news.headlines).map((h) => {
        const headline = obj(h);
        return {
          date: date(headline.date),
          title: str(headline.title) ?? "",
          chatter: arr(headline.chatter).map((c) => {
            const kind = obj(c).kind ?? c;
            return kind === "grey_market_premium"
              ? "Grey-market premium"
              : kind === "subscription"
                ? "Subscription talk"
                : "Unofficial";
          }),
        };
      }),
      note: str(news.note),
      detail: str(news.detail),
    },
    sections: arr(j.sections).map((s) => {
      const section = obj(s);
      return {
        key: str(section.key) ?? "",
        title: str(section.title) ?? "",
        detail: str(section.detail),
        claims: arr(section.claims).map(parseClaim),
      };
    }),
    citations: arr(j.citations).map((c) => {
      const cited = obj(c);
      return {
        claim: str(cited.claim) ?? "",
        citation: parseCitation(cited.citation),
      };
    }),
    documentProse: str(j.documentProse),
    stageLabel: stage ? stage.toUpperCase() : "Prospectus",
    hasProspectusDocument: !!str(document.documentId),
    readAt: date(j.asOf) ?? date(document.generatedAt),
    issuerLabel: issue?.issuer || str(document.symbol),
    hasLiveVerdict: !!str(verdict.detail) || !!str(badge.label),
    editorialSummary: editorial
      ? {
          sections: arr(editorial.sections).map((s) => {
            const section = obj(s);
            return {
              title: str(section.title) ?? "",
              body: str(section.body) ?? "",
            };
          }),
          attribution: str(editorial.attribution) ?? "",
          rhpUrl: str(editorial.rhpUrl),
        }
      : null,
    verdictAtBidding: stamped
      ? {
          badge: str(stamped.badge),
          peFloor: num(stamped.peFloor),
          pePostmoney: num(stamped.pePostmoney),
          peerMedian: num(stamped.peerMedian),
          bandTop: num(stamped.bandTop),
          biddingEnd: date(stamped.biddingEnd),
        }
      : null,
  };
}

export async function fetchIpoInsight(
  fincode: number,
  signal?: AbortSignal,
): Promise<IpoInsight> {
  return parseIpoInsight(await getJson(`ipo/insights/${fincode}`, { signal }));
}
