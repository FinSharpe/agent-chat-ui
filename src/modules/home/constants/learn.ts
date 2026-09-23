/**
 * Curated FinSharpe long-form content for Home: published research articles
 * and recorded talks — the same lists as finsharpe-mobile's
 * `lib/features/learn/learn_content.dart`; change the two together.
 *
 * Both lists are static by design. The articles live on third-party outlets
 * (Moneycontrol, Medium, LinkedIn) with no index API, and the talks are
 * appearances on other people's YouTube channels. A card opens a detail
 * popup (the reference's Reader / VideoDetail) that shows only what is here:
 * the article itself where the publisher allows framing, otherwise its
 * cover and a link to the original, since FinSharpe does not host the text; a talk plays in YouTube's own privacy-enhanced embed. Every
 * entry is real; nothing here is illustrative.
 */

export interface ResearchArticle {
  title: string;
  category: string;
  /** Publisher shown in the card footer. */
  source: string;
  url: string;
  /** The approved editorial cover (finsharpe-mobile #145), under `public/`. */
  cover: string;
  /** Brand fill behind the cover while it loads, or if it fails. */
  fill: string;
  /**
   * The publisher lets the page be framed, so the popup shows the article
   * itself. Medium and LinkedIn send `X-Frame-Options: sameorigin` /
   * `frame-ancestors 'self'`, so theirs link out instead.
   */
  embeddable?: boolean;
}

const NAVY = "#0A1F4D";
const BLUE = "#063BAA";
const BLUE_DEEP = "#053394";
const MINT = "#97EDCC";
const POSITIVE = "#0A9E6E";

const gradient = (from: string, to: string) =>
  `linear-gradient(90deg, ${from}, ${to})`;

export const RESEARCH_ARTICLES: ResearchArticle[] = [
  {
    title: "Timing the markets is futile but SIPs mitigate that problem",
    category: "Personal Finance",
    source: "Moneycontrol",
    url: "https://www.moneycontrol.com/news/opinion/timing-the-markets-is-futile-but-sips-mitigate-that-problem-11884941.html",
    cover: "/graphics/publications/sips.webp",
    fill: gradient(NAVY, BLUE),
    embeddable: true,
  },
  {
    title: "Markets & Mind Games",
    category: "Investor Behaviour",
    source: "Medium",
    url: "https://medium.com/@rohan_finsharpe/markets-mind-games-6000ea5aaf73",
    cover: "/graphics/publications/markets_mind_games.webp",
    fill: gradient(BLUE, MINT),
  },
  {
    title: "Dynamic Hedge Ratio: Rolling Regression for Pairs Trading",
    category: "Quant Research",
    source: "Analytics Vidhya",
    url: "https://medium.com/analytics-vidhya/dynamic-hedge-ratio-rolling-regression-for-pairs-trading-1befb0d86d38",
    cover: "/graphics/publications/dynamic_hedge_ratio.webp",
    fill: gradient(NAVY, MINT),
  },
  {
    title: "Statistical Arbitrage with Pairs Trading and Backtesting",
    category: "Quant Research",
    source: "Analytics Vidhya",
    url: "https://medium.com/analytics-vidhya/statistical-arbitrage-with-pairs-trading-and-backtesting-ec657b25a368",
    cover: "/graphics/publications/statistical_arbitrage.webp",
    fill: gradient(BLUE, BLUE_DEEP),
  },
  {
    title: "Diversify your Investment with Mutual Funds using a Quant Approach",
    category: "Mutual Funds",
    source: "LinkedIn Pulse",
    url: "https://www.linkedin.com/pulse/diversify-your-investment-mutual-funds-using-quants-sabir-jana-cfa",
    cover: "/graphics/publications/quant_mutual_funds.webp",
    fill: gradient(POSITIVE, MINT),
  },
];

export interface LearnVideo {
  /** YouTube video id — drives both the thumbnail and the watch URL. */
  id: string;
  /** FinSharpe's topic label for the talk, not YouTube's long raw title. */
  title: string;
  channel: string;
  /** Badge copy: Masterclass / Panel / Podcast / Interview. */
  kind: string;
  /** Runtime read off the published video (2026-08-31) — never estimated. */
  duration: string;
}

export const LEARN_VIDEOS: LearnVideo[] = [
  {
    id: "ypoLR5_nv9o",
    title: "Stock Allocation",
    channel: "smallcase",
    kind: "Masterclass",
    duration: "52:00",
  },
  {
    id: "9DxgK70tNnU",
    title: "AI in Investing",
    channel: "MMML",
    kind: "Panel",
    duration: "23:07",
  },
  {
    id: "0FbsxBsoGeE",
    title: "Psychology & Money",
    channel: "The Sound of Money",
    kind: "Podcast",
    duration: "34:08",
  },
  {
    id: "pJed55DAe_I",
    title: "Data Driven Investing",
    channel: "LENSELL Group",
    kind: "Panel",
    duration: "32:27",
  },
  {
    id: "bCro8kFcMng",
    title: "AI & Finance",
    channel: "Max Maharashtra",
    kind: "Interview",
    duration: "30:19",
  },
];

/** The 1280×720 frame, already 16:9 — not every upload has one. */
export const videoThumbnail = (id: string) =>
  `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;

/** 480×360 (letterboxed 4:3, cropped by the card) — exists for every video. */
export const videoFallbackThumbnail = (id: string) =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export const videoWatchUrl = (id: string) =>
  `https://www.youtube.com/watch?v=${id}`;

/**
 * YouTube's privacy-enhanced player (no cookies until playback). Only built
 * after the user presses Play, so autoplay starts it straight away.
 */
export const videoEmbedUrl = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1`;
