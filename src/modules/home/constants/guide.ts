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
//
// Re-read against the shipped app after the T-03/T-04/T-05/T-08/T-09 sweep:
// the guide is the one place that describes every screen at once, so a screen
// that was deleted or a feature that turned out not to exist leaves a wrong
// sentence here long after the screen itself is gone. Nothing below describes
// a surface the user cannot reach, and no step claims an outcome the app does
// not produce. Walk it again whenever a tab gains or loses a section.
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
        body: "Pick Get Answers on the Home screen, or the Chat tab. Home also lists four ready-made questions — Market Trends, Stock Ideas, Mutual Funds and Risk Check — and tapping one asks it for you.",
      },
      {
        title: "Ask in plain language",
        body: '"Is Tata Motors worth buying?" works just as well as a formal query. Company names, fund names and ticker symbols are all understood.',
      },
      {
        title: "Follow the thread",
        body: "Where the agent offers them, Suggested next steps appear under the answer. They continue the same line of thinking, so you can go deeper without retyping context.",
      },
    ],
    tip: "Answers built on market data carry a Sources & Reliability card. Open it to see which data went into the answer and how confident the system is.",
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
        body: "On the Import screen you can connect demat holdings, mutual fund folios, ETFs, SIPs and bank accounts through the RBI's Account Aggregator framework. You approve the mandate with the aggregator itself — FinSharpe never sees your bank or broker login.",
      },
      {
        title: "See it in one place",
        body: "Connected accounts roll up into your net worth on the same screen, and each asset class keeps its own row showing what came through and when it was last refreshed.",
      },
      {
        title: "Stay in control",
        body: "Disconnect any account at any time from its row. How your holdings are used, and where they go, is written out at the foot of the Import screen.",
      },
    ],
    tip: "Not ready to connect? Every question about markets, stocks and funds works without a single account linked.",
  },
  {
    id: "analyse",
    level: "Go deeper",
    icon: BarChart3,
    title: "Reading your portfolio analysis",
    summary:
      "Once accounts are connected, each asset class gets its own breakdown — plus one review across everything you own.",
    steps: [
      {
        title: "Run a class analysis",
        body: "Tap Analyse on any connected account for a breakdown of that holding: what is in it, how it is allocated and where it is concentrated.",
      },
      {
        title: "Run the comprehensive check",
        body: "The Comprehensive Portfolio Analysis reviews every account together. This is where overlap between funds and hidden sector concentration show up.",
      },
      {
        title: "Take it into chat",
        body: "Any analysis can be carried into a conversation, so you can ask follow-up questions about your own numbers rather than the market's.",
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
      "Discover is where you look beyond what you already own — the strategies FinSharpe publishes, the day's headlines and the IPO calendar.",
    steps: [
      {
        title: "Browse investment strategies",
        body: "Explore Investment Ideas opens the strategies created by FinSharpe's advisers, each with the holdings behind it. The other idea categories are still being built and are marked as such.",
      },
      {
        title: "Read the market news",
        body: "News Impact is the day's Nifty 50 headlines, each tagged with the company it is about. Ask AI on a headline carries it straight into a chat.",
      },
      {
        title: "Watch the IPO calendar",
        body: "IPO Watch lists the issues open for bidding and the ones opening next, with the price band, lot size and dates for each.",
      },
    ],
    tip: "Global Investing and Trading Ideas are still being built. Their rows stay on the Discover screen so you can see what's coming, but they don't open yet.",
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
        body: "Build Your Own Portfolios walks through five choices, starting with stocks or mutual funds, and generates a basket matching the rules you picked.",
      },
      {
        title: "Run an agent workflow",
        body: "Agent Workflows chain several analysis steps into one automated pipeline, each step's output feeding the next. You see the cost before it runs and the progress while it does.",
      },
      {
        title: "Keep the report",
        body: "Every finished workflow leaves a written report in your library, and each report has a link you can share with someone who isn't signed in.",
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
      "Two features that make longer-running work easier: guided expert modes, and a searchable record of everything you've asked.",
    steps: [
      {
        title: "Use Assistant Mode",
        body: "The sparkle beside the FinSharpe logo opens eight expert modes — risk profiling, backtesting, portfolio review and more. Pick one and it starts a guided conversation.",
      },
      {
        title: "Return to past work",
        body: "Memory keeps every conversation, searchable by title. Bookmark the ones that matter so they stay at the top of the page.",
      },
      {
        title: "Keep the list tidy",
        body: "Rename a chat to something you'll recognise later, and delete the ones you don't need. The same list sits in the sidebar, so you can jump back without leaving the page you're on.",
      },
    ],
    tip: "Reopen any past conversation and ask a follow-up — the thread keeps its full context, so you don't have to set the scene again.",
  },
];
