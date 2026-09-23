import {
  BarChart3,
  BookOpen,
  Brain,
  Compass,
  Download,
  Globe,
  Layers,
  MessageSquare,
  PieChart,
  Scale,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { BANNER_WAVE } from "@/components/shared/SectionKit";
import type {
  FeatureCard,
  StarterQuestion,
  WhatYouCanDoCard,
} from "../types/home.types";

/** The eight Features carousel cards — mobile shows one at a time, desktop
 *  two. Chat cards seed a fresh chat with their prompt. */
export const FEATURE_CARDS: FeatureCard[] = [
  {
    tag: "Market Today",
    title: "Today's Market",
    desc: "A quick read on how Indian markets moved today and what drove the biggest swings.",
    cta: "Read Brief",
    icon: TrendingUp,
    action: "chat",
    prompt:
      "Give me today's market brief — how did Indian markets move and what drove it?",
  },
  {
    tag: "Taxes",
    title: "Tax Loss Harvesting",
    desc: "Identify and harvest short-term capital losses to offset Indian tax liabilities.",
    cta: "Learn More",
    icon: Sparkles,
    action: "chat",
    prompt: "Explain how tax loss harvesting works for my portfolio",
  },
  {
    tag: "Mutual Funds",
    title: "Compare Mutual Funds",
    desc: "Put two funds side by side — returns, holdings overlap, expense ratio and risk.",
    cta: "Compare Now",
    icon: Scale,
    action: "chat",
    prompt:
      "Compare two mutual funds for me on returns, holdings overlap, expense ratio and risk.",
  },
  {
    tag: "Get Started",
    title: "Import Your Investments",
    desc: "Link Demat, Mutual Funds, Bank & more via the RBI Account Aggregator framework.",
    cta: "Connect Now",
    icon: Download,
    action: "import",
  },
  {
    tag: "Discover",
    title: "Explore Investment Strategies",
    // "Curated baskets and thematic themes" were the categories T-04 disabled;
    // Created by Advisors is the one that opens, so it is the one named here.
    desc: "Investment strategies published by FinSharpe's advisers, with the holdings behind each one.",
    cta: "Explore",
    icon: Compass,
    action: "discover-ideas",
  },
  {
    tag: "Planning",
    title: "Financial Planning",
    desc: "Map out goals, savings and retirement with a plan built around your own numbers.",
    cta: "Start Planning",
    icon: Wallet,
    action: "chat",
    prompt:
      "Help me build a financial plan — savings, goals and retirement based on my situation.",
  },
  {
    tag: "Memory",
    title: "Explore Memory",
    // Memory lists chats and nothing else — research reports live in the Agent
    // Workflows library, so they are not promised here (T-05).
    desc: "Search every past conversation and pick up where you left off.",
    cta: "View Memory",
    icon: Brain,
    action: "memory",
  },
  {
    tag: "Guide",
    title: "FinSharpeGPT Guide",
    desc: "Everything the app can do, from your first question to advanced agent workflows.",
    cta: "Open Guide",
    icon: BookOpen,
    action: "guide",
  },
];

/** The three wave images, cycled by index across the feature cards. The 1st
 *  and 3rd match the banners heading Discover "Explore" and Import "Connect";
 *  all are opaque and take the white-text treatment. */
export const FEATURE_CARD_IMAGES = [
  BANNER_WAVE.royal,
  "/graphics/feature-wave-cyan.jpg",
  BANNER_WAVE.sky,
];

/** A plain-language orientation strip above the starter questions. "Get
 *  Answers" carries no prompt: it opens an empty chat for the user's own
 *  question. */
export const WHAT_YOU_CAN_DO: WhatYouCanDoCard[] = [
  {
    title: "Get Answers",
    desc: "Ask anything about stocks, funds or your money",
    cta: "Ask now",
    icon: MessageSquare,
    action: "chat",
  },
  {
    title: "Ready-Made Portfolios",
    desc: "Explore baskets built by our research desk",
    cta: "Explore",
    icon: Layers,
    action: "discover-ideas",
  },
  {
    title: "Track Your Investments",
    desc: "Connect accounts and see everything in one place",
    cta: "Connect",
    icon: BarChart3,
    action: "import",
  },
];

/** "Show me…" rather than the screener verb "Screen", which reads as jargon.
 *  None depend on connected accounts, so every user gets the same four. */
export const STARTER_QUESTIONS: StarterQuestion[] = [
  {
    task: "Show me the top sectors in momentum",
    category: "Market Trends",
    icon: TrendingUp,
  },
  {
    task: "Show me fundamentally strong small-cap stocks",
    category: "Stock Ideas",
    icon: PieChart,
  },
  {
    task: "Show me the top 5 ranked flexi-cap funds",
    category: "Mutual Funds",
    icon: Globe,
  },
  {
    task: "Show me large-cap stocks with weak fundamentals",
    category: "Risk Check",
    icon: ShieldAlert,
  },
];

export const HOME_TAGLINE = "Ride the wave. Invest smarter.";
