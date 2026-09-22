import {
  BarChart3,
  Blocks,
  Compass,
  Download,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import type { GuideSection } from "../types/home.types";

// Content for the in-app "FinSharpeGPT Guide", ordered easy → advanced so a
// first-time user can read top-to-bottom and a returning one can jump to the
// section they need.
export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "basics",
    level: "Start here",
    icon: MessageSquare,
    title: "Asking your first question",
    summary:
      "FinSharpeGPT works like a conversation. You don't need special wording — ask the way you'd ask a friend who happens to be an analyst.",
    steps: [
      {
        title: "Open a chat",
        body: "Tap Get Answers on the home screen, or the chat tab at the bottom. You'll see three suggested questions grouped by Stocks, Mutual Funds and Personal Finance — tap one to try it instantly.",
      },
      {
        title: "Ask in plain language",
        body: '"Is Tata Motors worth buying?" works just as well as a formal query. Company names, fund names and ticker symbols are all understood.',
      },
      {
        title: "Follow the thread",
        body: "After every answer you'll see Suggested next steps. These continue the same line of thinking, so you can go deeper without retyping context.",
      },
    ],
    tip: "Every answer ends with a Sources & Reliability card. Open it to see exactly which data the answer was built from and how confident the system is.",
  },
  {
    id: "connect",
    level: "Start here",
    icon: Download,
    title: "Connecting your investments",
    summary:
      "Answers get sharper once FinSharpeGPT can see what you actually hold. Nothing is shared without your consent, and access is strictly read-only.",
    steps: [
      {
        title: "Use Account Aggregator",
        body: "On the Import screen, connect your Demat, mutual funds and bank accounts through the RBI's Account Aggregator framework. Credentials are never stored.",
      },
      {
        title: "Add what can't be linked",
        body: "Fixed deposits, insurance, real estate, gold and other holdings can be entered manually. They count toward your net worth and analysis just the same.",
      },
      {
        title: "Or track without connecting",
        body: "Not ready to link? Build a watchlist group of stocks, funds or ETFs instead. You still get analysis — just on securities you're following rather than owning.",
      },
    ],
    tip: "You can disconnect any account at any time, and your data stops being used immediately.",
  },
  {
    id: "analyse",
    level: "Go deeper",
    icon: BarChart3,
    title: "Reading your portfolio analysis",
    summary:
      "Once accounts are connected, each category gets its own dashboard — plus one overall health check across everything you own.",
    steps: [
      {
        title: "Run a category analysis",
        body: "Tap Analyse next to any connected account for a breakdown: allocation, concentration, quality scores and the specific risks found in that holding.",
      },
      {
        title: "Run the comprehensive check",
        body: "The Comprehensive Portfolio Analysis reviews every account together. This is where overlap between funds and hidden sector concentration show up.",
      },
      {
        title: "Watch the health score",
        body: "Your score reflects diversification, quality, valuation and risk-adjusted return. Tap it to see which factor is dragging the number down.",
      },
    ],
    tip: "Two funds can look different and still hold the same companies. The overlap check is the fastest way to spot diversification you don't actually have.",
  },
  {
    id: "discover",
    level: "Go deeper",
    icon: Compass,
    title: "Finding new ideas",
    summary:
      "Discover is where you explore beyond what you already own — curated strategies, global markets and thematic baskets built by the research desk.",
    steps: [
      {
        title: "Browse investment strategies",
        body: "Explore Investment Ideas groups strategies by source: advisor-created, research-backed, news-driven and famous-investor styles. Each shows returns, risk level and holdings.",
      },
      {
        title: "Look at News Impact",
        body: "A live map of how market themes connect to sectors and individual stocks. Tap any node to see the headline driving it and what it links to.",
      },
      {
        title: "Go global",
        body: "Global Investing offers thematic ETF baskets across US, Asia-Pacific and European markets, routed through SEBI-registered intermediaries.",
      },
    ],
  },
  {
    id: "build",
    level: "Advanced",
    icon: Blocks,
    title: "Building and testing your own",
    summary:
      "When you want something specific rather than off-the-shelf, you can construct a portfolio to your own rules — or let an agent do the research for you.",
    steps: [
      {
        title: "Build a custom basket",
        body: "The Portfolio Builder walks through five choices — asset type, style, market cap, size and allocation method — then generates a basket matching your rules.",
      },
      {
        title: "Run an agent workflow",
        body: "Agent Workflows chain multiple analysis steps into one automated pipeline: macro read, sector scoring, stock selection, fundamentals, technicals and a final shortlist.",
      },
      {
        title: "Explore trading strategies",
        body: "Exchange-approved algorithmic strategies, filtered by market scenario and risk profile, with backtested returns, drawdown and Sharpe ratio for each.",
      },
    ],
    tip: "Agent workflows take a few minutes because each step genuinely runs in sequence — the output of one feeds the next.",
  },
  {
    id: "assistant",
    level: "Advanced",
    icon: Sparkles,
    title: "Assistant Mode and Memory",
    summary:
      "Two features that make longer-running work easier: guided expert modes, and a searchable record of everything you've done.",
    steps: [
      {
        title: "Use Assistant Mode",
        body: "The wheel next to your profile picture holds eight expert modes — risk profiling, backtesting, portfolio review and more. Spin it to pick one and start a guided conversation.",
      },
      {
        title: "Return to past work",
        body: "Memory keeps every conversation, tagged and searchable. Bookmark the important ones so they stay at the top.",
      },
      {
        title: "Save reports and portfolios",
        body: "Research reports and saved portfolios live in Memory too, with version history on reports so you can compare how a view changed over time.",
      },
    ],
    tip: "Ask a follow-up question about any past conversation and FinSharpeGPT will pick up the full context of that thread.",
  },
];
