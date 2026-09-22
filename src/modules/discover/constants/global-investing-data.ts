// Placeholder content from the desktop-web reference — Global Investing has
// no backend yet, so every basket and figure here is illustrative.

export interface GlobalBasket {
  id: string;
  name: string;
  category: string;
  etfCount: number;
  badge?: "Hot" | "New";
  desc: string;
  return1Y: string;
  return3Y: string;
  risk: "Low" | "Moderate" | "High" | "Very High";
  tickers: string[];
  currency: string;
  rebalance: string;
  minInvest: string;
  why: string;
}

export const globalStats = [
  { label: "Baskets", value: "7" },
  { label: "ETFs covered", value: "25+" },
  { label: "Min invest", value: "₹5,000" },
  { label: "Currency", value: "USD" },
];

export const globalRegions = ["US Markets", "Asia Pacific", "Europe", "Global"];

export const globalThemes = [
  "All",
  "Technology",
  "Balanced",
  "ESG/Climate",
  "Emerging Markets",
  "Income",
  "Commodities",
];

export const globalBaskets: GlobalBasket[] = [
  {
    id: "ai-rev",
    name: "AI Revolution",
    category: "Technology",
    etfCount: 5,
    badge: "Hot",
    desc: "Pure-play exposure to artificial intelligence, semiconductors and robotics leaders.",
    return1Y: "+38.4%",
    return3Y: "+112.6%",
    risk: "Very High",
    tickers: ["SOXQ", "BOTZ", "AIQ", "WCLD", "ROBT"],
    currency: "USD",
    rebalance: "Quarterly",
    minInvest: "₹5,000",
    why: "Rides the multi-year AI capex super-cycle across chips, cloud and automation with diversified ETF exposure.",
  },
  {
    id: "multi-asset",
    name: "Global Multi-Asset",
    category: "Balanced",
    etfCount: 5,
    desc: "A one-click globally diversified mix of equities, bonds, gold and real assets.",
    return1Y: "+14.2%",
    return3Y: "+38.8%",
    risk: "Moderate",
    tickers: ["VT", "BNDW", "GLD", "REET", "PDBC"],
    currency: "USD",
    rebalance: "Semi-annual",
    minInvest: "₹5,000",
    why: "Balances growth and stability across asset classes and geographies to smooth out volatility.",
  },
  {
    id: "clean-energy",
    name: "Clean Energy Transition",
    category: "ESG/Climate",
    etfCount: 5,
    badge: "New",
    desc: "Solar, EVs, clean-tech infrastructure and battery materials for the energy transition.",
    return1Y: "+22.6%",
    return3Y: "+61.4%",
    risk: "High",
    tickers: ["ICLN", "DRIV", "HNDL", "QCLN", "LIT"],
    currency: "USD",
    rebalance: "Quarterly",
    minInvest: "₹5,000",
    why: "Positions for the structural shift to renewables and electrification backed by global policy tailwinds.",
  },
  {
    id: "us-mega-tech",
    name: "US Mega Tech",
    category: "Technology",
    etfCount: 4,
    badge: "Hot",
    desc: "Concentrated exposure to the largest US technology franchises.",
    return1Y: "+42.8%",
    return3Y: "+128.4%",
    risk: "Very High",
    tickers: ["QQQ", "XLK", "FTEC", "VGT"],
    currency: "USD",
    rebalance: "Quarterly",
    minInvest: "₹5,000",
    why: "Captures the earnings dominance of mega-cap US tech with deep-liquidity ETFs.",
  },
  {
    id: "em-ex-china",
    name: "EM ex-China Growth",
    category: "Emerging Markets",
    etfCount: 5,
    badge: "New",
    desc: "Emerging-market growth excluding China — India, Taiwan, ASEAN and Brazil.",
    return1Y: "+18.6%",
    return3Y: "+44.2%",
    risk: "High",
    tickers: ["EMXC", "INDA", "EWT", "ASEA", "EWZ"],
    currency: "USD",
    rebalance: "Quarterly",
    minInvest: "₹5,000",
    why: "Diversifies EM exposure away from single-country China risk toward faster-growing economies.",
  },
  {
    id: "dividend",
    name: "Global Dividend Income",
    category: "Income",
    etfCount: 4,
    desc: "High-quality dividend payers across developed and international markets.",
    return1Y: "+11.8%",
    return3Y: "+29.6%",
    risk: "Low",
    tickers: ["VYMI", "SDY", "IDV", "DVYE"],
    currency: "USD",
    rebalance: "Semi-annual",
    minInvest: "₹5,000",
    why: "Delivers steady USD income with lower volatility through diversified dividend ETFs.",
  },
  {
    id: "gold-real",
    name: "Gold & Real Assets",
    category: "Commodities",
    etfCount: 5,
    desc: "Gold, silver, broad commodities, inflation-linked bonds and mining equities.",
    return1Y: "+16.4%",
    return3Y: "+41.8%",
    risk: "Moderate",
    tickers: ["GLD", "SLV", "DJP", "TIP", "PICK"],
    currency: "USD",
    rebalance: "Semi-annual",
    minInvest: "₹5,000",
    why: "Acts as an inflation and macro hedge with tangible real-asset exposure.",
  },
];

export const globalRiskColor = (r: string) =>
  r === "Low"
    ? "bg-[#97edcc]/25 text-[#0A9E6E]"
    : r === "Moderate"
      ? "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
      : r === "High"
        ? "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400"
        : "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400";

const DONUT_PALETTE = [
  "#063BAA",
  "#2563EB",
  "#60A5FA",
  "#97edcc",
  "#0A9E6E",
  "#455578",
];

/** Donut + table holdings for a basket, built from its ticker list. */
export function basketHoldings(b: GlobalBasket) {
  const n = b.tickers.length;
  // Descending weights that sum to ~100.
  const raw = b.tickers.map((_, i) => n - i);
  const total = raw.reduce((a, c) => a + c, 0);
  return b.tickers.map((t, i) => ({
    ticker: t,
    fundName: `${t} ETF`,
    weight: Math.round((raw[i] / total) * 1000) / 10,
    expenseRatio: +(0.09 + (i % 4) * 0.12).toFixed(2),
    color: DONUT_PALETTE[i % DONUT_PALETTE.length],
  }));
}
