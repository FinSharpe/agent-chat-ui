// Placeholder content from the desktop-web reference — News Impact has no
// backend yet, so the graph and trending topics are illustrative.

export interface NewsCluster {
  id: number;
  name: string;
  color: string;
}

export interface NewsNode {
  id: string;
  label: string;
  /** Cluster id. */
  c: number;
  change: string;
  headline: string;
}

export const NEWS_CLUSTERS: NewsCluster[] = [
  { id: 0, name: "News & Sentiment", color: "#063BAA" },
  { id: 1, name: "Asset Classes", color: "#0A9E6E" },
  { id: 2, name: "Sectors", color: "#F59E0B" },
  { id: 3, name: "Stocks", color: "#8B5CF6" },
];

export const NEWS_NODES: NewsNode[] = [
  // News & Sentiment
  {
    id: "market-news",
    label: "Market News",
    c: 0,
    change: "+45.2%",
    headline:
      "Broad-based rally as risk appetite returns across global markets.",
  },
  {
    id: "sentiment",
    label: "Sentiment",
    c: 0,
    change: "+12.1%",
    headline: "Retail sentiment turns bullish; fear & greed index at 68.",
  },
  {
    id: "fed-policy",
    label: "Fed Policy",
    c: 0,
    change: "+22.3%",
    headline:
      "Markets price in a higher probability of rate cuts this quarter.",
  },
  {
    id: "inflation",
    label: "Inflation",
    c: 0,
    change: "-5.2%",
    headline: "Cooling inflation prints ease pressure on central banks.",
  },
  {
    id: "earnings",
    label: "Earnings Outlook",
    c: 0,
    change: "+32.1%",
    headline:
      "Quarterly corporate reports reflect resilient operating margins.",
  },
  {
    id: "investor-conf",
    label: "Investor Conf.",
    c: 0,
    change: "+18.5%",
    headline:
      "High net worth individuals raise allocations to emerging market equities.",
  },
  {
    id: "retail-sent",
    label: "Retail Sent.",
    c: 0,
    change: "+11.8%",
    headline: "Retail investors increase SIP flows into index trackers.",
  },
  {
    id: "housing-trends",
    label: "Housing Trends",
    c: 0,
    change: "+4.5%",
    headline:
      "Urban housing sales touch multi-year high, boosting housing credit.",
  },
  {
    id: "ai-rev",
    label: "AI Revolution",
    c: 0,
    change: "+58.2%",
    headline:
      "AI infra spending reaches historic levels with massive datacenter expansions.",
  },
  {
    id: "ma-activity",
    label: "M&A Activity",
    c: 0,
    change: "+15.4%",
    headline: "Consolidation speeds up in Indian banking and chemical sectors.",
  },
  {
    id: "consumer-spend",
    label: "Consumer Spend",
    c: 0,
    change: "+6.2%",
    headline: "Premium retail sales climb while entry-level staples lag.",
  },
  {
    id: "recession-fears",
    label: "Recession Fears",
    c: 0,
    change: "-10.5%",
    headline:
      "Recession probabilities decline following strong labor market prints.",
  },

  // Asset Classes
  {
    id: "equities",
    label: "Equities",
    c: 1,
    change: "+3.4%",
    headline: "Equity indices extend gains led by growth sectors.",
  },
  {
    id: "real-estate",
    label: "Real Estate",
    c: 1,
    change: "+1.2%",
    headline: "Urban land prices rise in major residential hubs.",
  },
  {
    id: "treasuries",
    label: "Treasuries",
    c: 1,
    change: "+0.8%",
    headline: "Sovereign bond yields consolidate as global liquidity improves.",
  },
  {
    id: "commodities",
    label: "Commodities",
    c: 1,
    change: "-2.1%",
    headline: "Base metals retreat on rising global production counts.",
  },
  {
    id: "crypto",
    label: "Crypto",
    c: 1,
    change: "+8.6%",
    headline: "Digital assets rally alongside risk-on flows.",
  },
  {
    id: "gold",
    label: "Gold",
    c: 1,
    change: "+2.1%",
    headline: "Gold firms on a softer dollar and haven demand.",
  },
  {
    id: "bonds",
    label: "Bonds",
    c: 1,
    change: "-1.2%",
    headline: "Yields tick lower as rate-cut bets build.",
  },
  {
    id: "munis",
    label: "Municipal Bonds",
    c: 1,
    change: "+0.4%",
    headline: "Municipal bonds see steady uptake from tax-aware investors.",
  },
  {
    id: "pe",
    label: "Private Equity",
    c: 1,
    change: "+5.1%",
    headline: "Late-stage VC and private equity deals recover in Tech sectors.",
  },
  {
    id: "reits",
    label: "REITs",
    c: 1,
    change: "+1.8%",
    headline:
      "Commercial office space REITs report occupancy levels above 90%.",
  },

  // Sectors
  {
    id: "tech",
    label: "Technology",
    c: 2,
    change: "+6.4%",
    headline: "AI-led demand powers technology sector outperformance.",
  },
  {
    id: "financials",
    label: "Financials",
    c: 2,
    change: "+2.8%",
    headline: "Banks rally on improving net interest margins.",
  },
  {
    id: "energy",
    label: "Energy",
    c: 2,
    change: "-1.9%",
    headline: "Energy lags as crude softens on the supply outlook.",
  },
  {
    id: "health",
    label: "Healthcare",
    c: 2,
    change: "+1.5%",
    headline: "Healthcare steady on defensive rotation.",
  },
  {
    id: "consumer-goods",
    label: "Consumer Goods",
    c: 2,
    change: "+0.8%",
    headline: "Fast-moving consumer goods see muted volume growth.",
  },
  {
    id: "industrials",
    label: "Industrials",
    c: 2,
    change: "+2.1%",
    headline:
      "Cap-goods makers report record order backlogs from infrastructure projects.",
  },
  {
    id: "utilities",
    label: "Utilities",
    c: 2,
    change: "+0.5%",
    headline: "Power generation firms invest heavily in green projects.",
  },
  {
    id: "materials",
    label: "Materials",
    c: 2,
    change: "-1.0%",
    headline: "Cement and metal producers face input cost pressures.",
  },
  {
    id: "infra",
    label: "Infrastructure",
    c: 2,
    change: "+3.2%",
    headline:
      "Budget allocations to highway and rail corridors boost capital builders.",
  },
  {
    id: "telecom",
    label: "Telecom",
    c: 2,
    change: "+1.2%",
    headline: "Average revenue per user climbs as tariff hikes roll through.",
  },

  // Stocks
  {
    id: "NVDA",
    label: "NVIDIA",
    c: 3,
    change: "+4.8%",
    headline: "NVIDIA extends its run on record data-center demand.",
  },
  {
    id: "AAPL",
    label: "Apple",
    c: 3,
    change: "+1.2%",
    headline: "Apple gains ahead of a new product cycle.",
  },
  {
    id: "MSFT",
    label: "Microsoft",
    c: 3,
    change: "+2.1%",
    headline: "Microsoft rises on cloud & AI momentum.",
  },
  {
    id: "TSLA",
    label: "Tesla",
    c: 3,
    change: "-2.4%",
    headline: "Tesla slips on delivery concerns.",
  },
  {
    id: "JPM",
    label: "JPMorgan",
    c: 3,
    change: "+1.8%",
    headline: "JPMorgan advances on strong trading revenue.",
  },
  {
    id: "AMZN",
    label: "Amazon",
    c: 3,
    change: "+3.2%",
    headline: "Amazon climbs on retail & AWS strength.",
  },
  {
    id: "RELIANCE",
    label: "Reliance",
    c: 3,
    change: "+1.5%",
    headline:
      "Reliance retail and telecom expansions offset minor refining drags.",
  },
  {
    id: "HDFCBANK",
    label: "HDFC Bank",
    c: 3,
    change: "+2.0%",
    headline:
      "HDFC Bank reports steady deposit growth and stable credit metrics.",
  },
  {
    id: "TCS",
    label: "TCS",
    c: 3,
    change: "+1.1%",
    headline: "TCS bags multiple mega-deals from European financial clients.",
  },
  {
    id: "INFY",
    label: "Infosys",
    c: 3,
    change: "+0.9%",
    headline:
      "Infosys expands AI training partnerships with global system operators.",
  },
];

/** Cross-cluster links: news → assets/sectors, sectors → stocks. */
export const NEWS_CROSS_EDGES: [string, string][] = [
  ["fed-policy", "bonds"],
  ["inflation", "gold"],
  ["market-news", "equities"],
  ["crypto", "sentiment"],
  ["pe", "ma-activity"],
  ["ai-rev", "tech"],
  ["fed-policy", "financials"],
  ["recession-fears", "health"],
  ["consumer-spend", "consumer-goods"],
  ["housing-trends", "infra"],
  ["tech", "NVDA"],
  ["tech", "AAPL"],
  ["tech", "MSFT"],
  ["financials", "JPM"],
  ["financials", "HDFCBANK"],
  ["energy", "RELIANCE"],
  ["tech", "TCS"],
  ["tech", "INFY"],
  ["consumer-goods", "AMZN"],
  ["industrials", "TSLA"],
  ["equities", "tech"],
  ["equities", "financials"],
  ["commodities", "energy"],
  ["real-estate", "infra"],
  ["NVDA", "ai-rev"],
  ["MSFT", "ai-rev"],
];

export const NEWS_TRENDING = [
  { t: "Market News", v: "+45.2%" },
  { t: "Trending Topics", v: "+35.8%" },
  { t: "Social Media", v: "+28.4%" },
  { t: "Sentiment Score", v: "+12.1%" },
  { t: "Investor Confidence", v: "+18.5%" },
  { t: "Fed Policy", v: "+22.3%" },
  { t: "Inflation Data", v: "-5.2%" },
  { t: "Earnings Outlook", v: "+32.1%" },
];
