import type { MarketNews } from "../types/home.types";

// PLACEHOLDER CONTENT — static copy from the design reference; there is no market-news API yet.
export const MARKET_NEWS: MarketNews[] = [
  {
    id: "news1",
    category: "Policy Update",
    headline: "RBI Keeps Repo Rate Unchanged at 6.5%",
    summary:
      "The Reserve Bank of India has decided to keep interest rates steady to control inflation. High-yield bank FDs and short-duration debt mutual funds are expected to remain attractive in the medium term.",
    source: "Moneycontrol",
    time: "2 hours ago",
    sentiment: "neutral",
  },
  {
    id: "news2",
    category: "Earnings Announcement",
    headline: "HDFC Bank Reports 16% YoY Profit Rise in Q1",
    summary:
      "HDFC Bank surpassed analyst expectations with a 16% rise in net profit, driven by strong loan growth and improved credit quality. Asset quality remained stable, prompting positive brokerage upgrades.",
    source: "Livemint",
    time: "5 hours ago",
    sentiment: "positive",
  },
  {
    id: "news3",
    category: "Market Outlook",
    headline: "Nifty 50 Crosses 24,000 Milestone Amid Foreign Inflows",
    summary:
      "FIIs turning net buyers combined with strong retail SIP flows have pushed the benchmark index to fresh record highs. Analysts warn of near-term valuation excesses in small and mid-cap spaces.",
    source: "Economic Times",
    time: "1 day ago",
    sentiment: "positive",
  },
];
