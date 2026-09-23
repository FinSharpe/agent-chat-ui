import { Layers, PieChart, TrendingUp, type LucideIcon } from "lucide-react";

export type WatchlistCardId = "w-equity" | "w-mf" | "w-etf";

export interface WatchlistCard {
  id: WatchlistCardId;
  name: string;
  desc: string;
  icon: LucideIcon;
  /** "Analyse All …" button label and overview column. */
  analyseAllLabel: string;
  /** Which search endpoint backs "Add Securities" for this card. */
  search: "stocks" | "mutual-funds";
  placeholder: string;
}

/** The three watchlist cards from the reference Import screen. */
export const WATCHLIST_CARDS: WatchlistCard[] = [
  {
    id: "w-equity",
    name: "Equity Holdings",
    desc: "Track stocks in your watchlist without connecting a demat account",
    icon: TrendingUp,
    analyseAllLabel: "Equities",
    search: "stocks",
    placeholder: "e.g. TCS, HDFC Bank",
  },
  {
    id: "w-mf",
    name: "Mutual Fund Holdings",
    desc: "Track mutual funds and SIPs without importing from AMC platforms",
    icon: PieChart,
    analyseAllLabel: "Funds",
    search: "mutual-funds",
    placeholder: "e.g. Parag Parikh Flexi Cap",
  },
  {
    id: "w-etf",
    name: "ETF Holdings",
    desc: "Track index ETFs, gold ETFs and sector ETFs in your watchlist",
    icon: Layers,
    analyseAllLabel: "ETFs",
    search: "stocks",
    placeholder: "e.g. NIFTYBEES, GOLDBEES",
  },
];

export const WATCHLIST_GROUP_NAME_MAX = 20;
