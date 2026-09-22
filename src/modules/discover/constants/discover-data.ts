import { IdeaCategory, IdeaStrategy } from "../types/discover.types";

/**
 * The static half of the Explore Investment Ideas catalog — every category
 * except "Created by Advisors", which comes from the strategies API. These
 * baskets have no backend yet: their figures are illustrative.
 */

const basket = (
  s: Omit<IdeaStrategy, "source" | "tags"> & { tags?: string[] },
): IdeaStrategy => ({
  ...s,
  source: "basket",
  tags: s.tags ?? [],
  summary: s.summary ?? s.tags?.join(" · "),
});

export const specialBaskets: IdeaStrategy[] = [
  basket({
    id: "ipo-corner",
    title: "IPO Corner",
    tags: ["IPO"],
    description:
      "Upcoming IPOs with comprehensive DRHP analysis and public information scanning",
    launchStatus: "Upcoming",
    risk: "High",
    stocks: 12,
  }),
  basket({
    id: "corporate-actions",
    title: "Corporate Actions",
    tags: ["Events"],
    description:
      "Opportunities from mergers, acquisitions, buybacks, spin-offs, preference share allotments, and special dividends",
    return1Y: "+14.3%",
    risk: "Medium",
    stocks: 18,
  }),
  basket({
    id: "capacity-expansion",
    title: "Capacity Expansion",
    tags: ["Capex"],
    description:
      "Companies announcing major capacity expansion plans and capital expenditure investments",
    return1Y: "+22.7%",
    risk: "Medium",
    stocks: 20,
  }),
  basket({
    id: "large-order-books",
    title: "Large Order Books",
    tags: ["Orders"],
    description:
      "Companies with significant order book wins and long-term contract announcements",
    return1Y: "+18.9%",
    risk: "Medium",
    stocks: 16,
  }),
  basket({
    id: "mergers-acquisitions",
    title: "Mergers & Acquisitions",
    tags: ["M&A"],
    description:
      "Companies involved in merger, acquisition, or takeover activities with potential arbitrage opportunities",
    return1Y: "+16.8%",
    risk: "High",
    stocks: 22,
  }),
  basket({
    id: "re-rating",
    title: "Re-rating Opportunities",
    tags: ["Value"],
    description:
      "Undervalued companies with catalysts for potential re-rating and multiple expansion",
    return1Y: "+25.3%",
    risk: "Medium",
    stocks: 24,
  }),
  basket({
    id: "red-flag-stocks",
    title: "Red Flag Stocks",
    tags: ["Contrarian"],
    summary: "Contrarian / short candidates",
    description:
      "Stocks with deteriorating fundamentals and technicals - for contrarian or short strategies",
    return1Y: "-8.5%",
    risk: "High",
    stocks: 25,
  }),
];

export const newsBasedBaskets: IdeaStrategy[] = [
  basket({
    id: "fed-rate-cut",
    title: "Fed Rate Cut Beneficiaries",
    tags: ["Macro"],
    description: "Stocks likely to benefit from potential interest rate cuts",
    return1Y: "+16.8%",
    risk: "Medium",
    stocks: 20,
  }),
  basket({
    id: "earnings-beat",
    title: "Earnings Beat Winners",
    tags: ["Earnings"],
    description: "Companies that consistently exceed earnings expectations",
    return1Y: "+21.4%",
    risk: "Medium",
    stocks: 18,
  }),
  basket({
    id: "trade-tariffs",
    title: "Affected by Trade Tariffs",
    tags: ["Macro"],
    description:
      "Companies significantly impacted by international trade tariffs and import/export regulations",
    return1Y: "-3.2%",
    risk: "High",
    stocks: 22,
  }),
];

export const researchPaperBaskets: IdeaStrategy[] = [
  basket({
    id: "union-budget",
    title: "Union Budget",
    tags: ["Policy"],
    description:
      "Companies positioned to benefit from latest Union Budget allocations and policy announcements",
    return1Y: "+19.5%",
    risk: "Medium",
    stocks: 24,
  }),
  basket({
    id: "semiconductor-boost",
    title: "Semiconductor Boost",
    tags: ["Tech"],
    description:
      "Semiconductor and related companies benefiting from government PLI schemes and global chip shortage",
    return1Y: "+35.8%",
    risk: "High",
    stocks: 16,
  }),
  basket({
    id: "pharma-approvals",
    title: "Pharma Approvals",
    tags: ["Pharma"],
    description:
      "Pharmaceutical companies with promising drug pipeline approvals and regulatory clearances",
    return1Y: "+26.4%",
    risk: "High",
    stocks: 18,
  }),
];

// Placeholder content from the desktop-web reference — the app had no
// filings-based baskets before this category was added.
export const filingsBaskets: IdeaStrategy[] = [
  basket({
    id: "increasing-order-book",
    title: "Increasing Order Book",
    tags: ["Filings"],
    return1Y: "+28.3%",
    risk: "Medium",
    stocks: 22,
  }),
  basket({
    id: "filings-capacity-expansion",
    title: "Capacity Expansion",
    tags: ["Capex"],
    return1Y: "+24.7%",
    risk: "Medium",
    stocks: 18,
  }),
  basket({
    id: "inventory-build-up",
    title: "Inventory Build-up",
    tags: ["Filings"],
    return1Y: "+19.2%",
    risk: "Medium",
    stocks: 20,
  }),
  basket({
    id: "subdued-forecasts",
    title: "Subdued Forecasts",
    tags: ["Caution"],
    return1Y: "-6.8%",
    risk: "High",
    stocks: 16,
  }),
  basket({
    id: "earnings-revisions",
    title: "Earnings Revisions",
    tags: ["Earnings"],
    return1Y: "+31.5%",
    risk: "Medium",
    stocks: 24,
  }),
  basket({
    id: "debt-reduction",
    title: "Debt Reduction",
    tags: ["Balance Sheet"],
    return1Y: "+22.1%",
    risk: "Low",
    stocks: 19,
  }),
  basket({
    id: "new-product-launches",
    title: "New Product Launches",
    tags: ["Growth"],
    return1Y: "+26.9%",
    risk: "High",
    stocks: 17,
  }),
  basket({
    id: "geographic-expansion",
    title: "Geographic Expansion",
    tags: ["Growth"],
    return1Y: "+20.4%",
    risk: "Medium",
    stocks: 21,
  }),
];

export const curatedBaskets: IdeaStrategy[] = [
  basket({
    id: "ai-technology-leaders",
    title: "AI & Technology Leaders",
    tags: ["Technology", "Trending"],
    description:
      "Top companies driving the AI revolution with strong fundamentals and growth prospects",
    return1Y: "+24.5%",
    risk: "Medium",
    stocks: 15,
  }),
  basket({
    id: "esg-champions",
    title: "ESG Champions",
    tags: ["ESG"],
    description:
      "Sustainable companies with excellent environmental, social, and governance practices",
    return1Y: "+18.2%",
    risk: "Low",
    stocks: 20,
  }),
  basket({
    id: "high-dividend-yield",
    title: "High Dividend Yield",
    tags: ["Income"],
    description:
      "Stable companies offering consistent and attractive dividend payments",
    return1Y: "+12.8%",
    risk: "Low",
    stocks: 25,
  }),
  basket({
    id: "small-cap-gems",
    title: "Small Cap Gems",
    tags: ["Growth", "Trending"],
    description: "Promising small-cap companies with high growth potential",
    return1Y: "+31.7%",
    risk: "High",
    stocks: 12,
  }),
];

export const thematicBaskets: IdeaStrategy[] = [
  basket({
    id: "electric-vehicles",
    title: "Electric Vehicles",
    tags: ["Theme"],
    summary: "EV manufacturers & battery tech",
    stocks: 18,
    return1Y: "+28.4%",
  }),
  basket({
    id: "renewable-energy",
    title: "Renewable Energy",
    tags: ["Theme"],
    summary: "Solar, wind & clean energy",
    stocks: 22,
    return1Y: "+15.6%",
  }),
  basket({
    id: "healthcare-innovation",
    title: "Healthcare Innovation",
    tags: ["Theme"],
    summary: "Biotech & pharmaceutical",
    stocks: 16,
    return1Y: "+19.3%",
  }),
  basket({
    id: "fintech-revolution",
    title: "Fintech Revolution",
    tags: ["Theme"],
    summary: "Digital banking & payments",
    stocks: 14,
    return1Y: "+22.1%",
  }),
];

/** Famous investors — the title is the investor, the summary their style. */
export const investorBaskets: IdeaStrategy[] = [
  basket({
    id: "warren-buffett",
    title: "Warren Buffett",
    tags: ["Value"],
    summary: "Value Investing",
    description:
      "Buy wonderful companies at fair prices and hold forever. Focus on strong moats and predictable earnings.",
    risk: "Low",
    return1Y: "+19.8%",
    stocks: 15,
  }),
  basket({
    id: "peter-lynch",
    title: "Peter Lynch",
    tags: ["GARP"],
    summary: "Growth at Reasonable Price",
    description:
      "Invest in what you know. Look for companies with strong growth but reasonable valuations (PEG ratio).",
    risk: "Medium",
    return1Y: "+23.5%",
    stocks: 25,
  }),
  basket({
    id: "cathie-wood",
    title: "Cathie Wood",
    tags: ["Innovation"],
    summary: "Disruptive Innovation",
    description:
      "Invest in companies creating and benefiting from technological disruption and innovation.",
    risk: "High",
    return1Y: "+28.7%",
    stocks: 18,
  }),
];

/** Category order after "Created by Advisors", as in the reference. */
export const staticIdeaCategories: IdeaCategory[] = [
  {
    id: "special",
    name: "Special Investment Opportunities",
    strategies: specialBaskets,
  },
  {
    id: "news-based",
    name: "News-Based Investment Baskets",
    strategies: newsBasedBaskets,
  },
  {
    id: "research",
    name: "Ideas from Research Papers",
    strategies: researchPaperBaskets,
  },
  {
    id: "filings",
    name: "Ideas from Company Filings",
    strategies: filingsBaskets,
  },
  {
    id: "curated",
    name: "Curated Investment Baskets",
    strategies: curatedBaskets,
  },
  {
    id: "themes",
    name: "Trending Investment Themes",
    strategies: thematicBaskets,
  },
  {
    id: "investors",
    name: "Famous Investor Strategies",
    strategies: investorBaskets,
  },
];

const staticById = new Map(
  staticIdeaCategories.flatMap((c) =>
    c.strategies.map((s) => [s.id, s] as const),
  ),
);

/** A static basket by id, or undefined for anything else (an advisor id). */
export const findStaticIdea = (id: string) => staticById.get(id);
