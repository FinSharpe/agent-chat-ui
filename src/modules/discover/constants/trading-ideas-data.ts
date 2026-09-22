// Placeholder content from the desktop-web reference — Explore Trading Ideas
// has no backend yet, so every algorithm and figure here is illustrative.

export type TradeScenario = "Bullish" | "Bearish" | "Sideways";
export type TradeRisk = "Conservative" | "Moderate" | "Aggressive";

export interface TradingAlgo {
  id: string;
  name: string;
  scenario: TradeScenario;
  risk: TradeRisk;
  popular?: boolean;
  annualReturn: string;
  maxDD: string;
  winRate: string;
  sharpe: string;
  tags: string[];
  instrument: string;
  exchange: string;
  timeframe: string;
  logic: string;
}

export const tradingStats = [
  { label: "Algos Listed", value: "13+" },
  { label: "Avg Sharpe", value: "1.87" },
  { label: "Backtest", value: "5Y Data" },
  { label: "Exchanges", value: "NSE·BSE" },
];

export const tradeScenarios: { id: TradeScenario; note: string }[] = [
  {
    id: "Bullish",
    note: "Trend-following & breakout strategies for rising markets",
  },
  {
    id: "Bearish",
    note: "Short-selling & hedging strategies for falling markets",
  },
  {
    id: "Sideways",
    note: "Range-bound & options-income strategies for flat markets",
  },
];

export const tradeRisks: (TradeRisk | "All")[] = [
  "All",
  "Conservative",
  "Moderate",
  "Aggressive",
];

export const tradingAlgos: TradingAlgo[] = [
  // Bullish
  {
    id: "nifty-momo",
    name: "Nifty 50 Momentum Breakout",
    scenario: "Bullish",
    risk: "Aggressive",
    popular: true,
    annualReturn: "34.2%",
    maxDD: "14.8%",
    winRate: "58%",
    sharpe: "1.62",
    tags: ["Momentum", "Breakout", "15-min intraday"],
    instrument: "Nifty 50 Index",
    exchange: "NSE",
    timeframe: "15-min intraday",
    logic:
      "Enters long when price breaks the prior day's high with above-average volume; exits on a trailing stop or end-of-day, whichever is first.",
  },
  {
    id: "ema-btst",
    name: "EMA Crossover BTST",
    scenario: "Bullish",
    risk: "Moderate",
    annualReturn: "26.8%",
    maxDD: "10.2%",
    winRate: "63%",
    sharpe: "1.84",
    tags: ["EMA", "BTST", "Daily"],
    instrument: "Nifty 500 stocks",
    exchange: "NSE",
    timeframe: "Daily (BTST)",
    logic:
      "Buys at close when the 9-EMA crosses above the 21-EMA on strong closes; squares off the next morning (Buy Today Sell Tomorrow).",
  },
  {
    id: "sector-rot",
    name: "Sector Rotation – Long Only",
    scenario: "Bullish",
    risk: "Moderate",
    popular: true,
    annualReturn: "22.4%",
    maxDD: "12.1%",
    winRate: "71%",
    sharpe: "1.48",
    tags: ["Sector", "Rotation", "Weekly rebalance"],
    instrument: "Sector indices",
    exchange: "NSE",
    timeframe: "Weekly rebalance",
    logic:
      "Ranks sectors by relative strength each week and rotates capital into the top-performing sectors, holding until momentum fades.",
  },
  {
    id: "gap-up",
    name: "Gap-Up Continuation",
    scenario: "Bullish",
    risk: "Aggressive",
    annualReturn: "41.6%",
    maxDD: "22.4%",
    winRate: "52%",
    sharpe: "1.38",
    tags: ["Gap", "Event", "Intraday"],
    instrument: "F&O stocks",
    exchange: "NSE",
    timeframe: "Intraday",
    logic:
      "Enters gap-up openings backed by positive news/earnings; rides intraday continuation with a tight stop below the opening range.",
  },
  // Bearish
  {
    id: "weak-short",
    name: "Weak Sector Short Selling",
    scenario: "Bearish",
    risk: "Aggressive",
    popular: true,
    annualReturn: "28.6%",
    maxDD: "16.4%",
    winRate: "55%",
    sharpe: "1.41",
    tags: ["Short Selling", "Sector", "Daily swing"],
    instrument: "Sector laggards",
    exchange: "NSE",
    timeframe: "Daily swing",
    logic:
      "Shorts the weakest-ranked sector constituents breaking key support; covers on target or a stop above the breakdown level.",
  },
  {
    id: "put-spread",
    name: "Nifty Put Spread Hedge",
    scenario: "Bearish",
    risk: "Conservative",
    annualReturn: "18.2%",
    maxDD: "6.8%",
    winRate: "61%",
    sharpe: "2.12",
    tags: ["Options", "Hedge", "Weekly expiry"],
    instrument: "Nifty options",
    exchange: "NSE",
    timeframe: "Weekly expiry",
    logic:
      "Buys a defined-risk bear put spread to hedge downside while capping cost; managed to weekly expiry with delta-based adjustments.",
  },
  {
    id: "vix-revert",
    name: "VIX Spike Mean Reversion Short",
    scenario: "Bearish",
    risk: "Moderate",
    annualReturn: "24.1%",
    maxDD: "9.2%",
    winRate: "68%",
    sharpe: "1.96",
    tags: ["VIX", "Mean Reversion", "Multi-day"],
    instrument: "India VIX / Nifty",
    exchange: "NSE",
    timeframe: "Multi-day",
    logic:
      "Fades extreme volatility spikes by shorting into panic; exits as VIX mean-reverts toward its moving average.",
  },
  {
    id: "div-harvest",
    name: "Defensive Dividend Harvesting",
    scenario: "Bearish",
    risk: "Conservative",
    annualReturn: "12.8%",
    maxDD: "4.2%",
    winRate: "82%",
    sharpe: "2.66",
    tags: ["Dividend", "Defensive", "Event-driven"],
    instrument: "High-dividend stocks",
    exchange: "NSE",
    timeframe: "Event-driven",
    logic:
      "Rotates into defensive dividend payers around ex-dividend dates to harvest income with low drawdown during market stress.",
  },
  // Sideways
  {
    id: "iron-condor",
    name: "Weekly Iron Condor",
    scenario: "Sideways",
    risk: "Conservative",
    popular: true,
    annualReturn: "20.8%",
    maxDD: "8.4%",
    winRate: "72%",
    sharpe: "2.24",
    tags: ["Iron Condor", "Options", "Weekly expiry"],
    instrument: "Nifty options",
    exchange: "NSE",
    timeframe: "Weekly expiry",
    logic:
      "Sells a delta-neutral iron condor to collect premium in range-bound markets; adjusts wings if price threatens either short strike.",
  },
  {
    id: "rsi-revert",
    name: "RSI Mean Reversion",
    scenario: "Sideways",
    risk: "Moderate",
    annualReturn: "17.4%",
    maxDD: "7.6%",
    winRate: "67%",
    sharpe: "1.72",
    tags: ["RSI", "Mean Reversion", "2-5 day swing"],
    instrument: "Liquid large-caps",
    exchange: "NSE",
    timeframe: "2–5 day swing",
    logic:
      "Buys oversold (RSI < 30) and sells overbought (RSI > 70) within a defined range; exits at the mean or a time stop.",
  },
  {
    id: "covered-call",
    name: "Covered Call Strategy",
    scenario: "Sideways",
    risk: "Conservative",
    annualReturn: "14.6%",
    maxDD: "5.2%",
    winRate: "78%",
    sharpe: "2.48",
    tags: ["Covered Call", "Income", "Monthly expiry"],
    instrument: "Stock + options",
    exchange: "NSE",
    timeframe: "Monthly expiry",
    logic:
      "Holds the underlying and writes monthly out-of-the-money calls to generate steady income in flat markets.",
  },
  {
    id: "pairs-it",
    name: "Pairs Trading – IT Sector",
    scenario: "Sideways",
    risk: "Moderate",
    popular: true,
    annualReturn: "19.2%",
    maxDD: "6.4%",
    winRate: "74%",
    sharpe: "2.18",
    tags: ["Pairs", "Market Neutral", "Daily rebalance"],
    instrument: "IT sector pairs",
    exchange: "NSE",
    timeframe: "Daily rebalance",
    logic:
      "Goes long the underperformer and short the outperformer within correlated IT pairs; profits as the spread mean-reverts.",
  },
  {
    id: "short-strangle",
    name: "Short Strangle – BankNifty",
    scenario: "Sideways",
    risk: "Aggressive",
    annualReturn: "38.4%",
    maxDD: "24.6%",
    winRate: "65%",
    sharpe: "1.44",
    tags: ["Strangle", "BankNifty", "Weekly expiry"],
    instrument: "BankNifty options",
    exchange: "NSE",
    timeframe: "Weekly expiry",
    logic:
      "Sells out-of-the-money calls and puts to collect elevated BankNifty premium; strictly stop-managed against sharp moves.",
  },
];

export const tradeRiskColor = (r: TradeRisk) =>
  r === "Conservative"
    ? "bg-[#97edcc]/25 text-[#0A9E6E]"
    : r === "Moderate"
      ? "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
      : "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400";
