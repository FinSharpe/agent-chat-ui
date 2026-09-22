import {
  BarChart3,
  FileText,
  Gauge,
  History,
  PieChart,
  Scale,
  Search,
  Wallet,
} from "lucide-react";
import type { AssistantTool } from "../types";

/**
 * The eight guided modes on the Assistant wheel, in clockwise order from
 * 12 o'clock. "Start Chat" opens a fresh chat seeded with the mode's prompt.
 */
export const ASSISTANT_TOOLS: AssistantTool[] = [
  {
    id: "risk-profiling",
    name: "Risk Profiling",
    desc: "Assess your risk tolerance and create personalized investment strategies aligned with your profile",
    icon: Gauge,
    prompt:
      "Help me assess my risk tolerance and build a personalized investment strategy.",
  },
  {
    id: "strategy-backtesting",
    name: "Strategy Backtesting",
    desc: "Test and validate your investment strategies using historical market data",
    icon: History,
    prompt:
      "I want to backtest an investment strategy using historical market data.",
  },
  {
    id: "personal-finance",
    name: "Personal Finance",
    desc: "Check your financial health and start planning your investment journey through risk profiling and goal setting",
    icon: Wallet,
    prompt: "Help me check my financial health and plan my investment journey.",
  },
  {
    id: "ips",
    name: "Investment Policy Statement",
    desc: "Create a personalized investment policy through risk profiling, objectives assessment, and KYC compliance",
    icon: FileText,
    prompt: "Help me create a personalized Investment Policy Statement.",
  },
  {
    id: "stock-research",
    name: "Stock Deep Research",
    desc: "In-depth analysis of individual stocks with fundamentals, technicals, and market sentiment",
    icon: Search,
    prompt: "Do an in-depth deep research analysis on a stock.",
  },
  {
    id: "portfolio-rebalance",
    name: "Portfolio Rebalance",
    desc: "Optimize your portfolio allocation with factor-based rebalancing and expert recommendations",
    icon: Scale,
    prompt:
      "Optimize and rebalance my portfolio allocation with expert recommendations.",
  },
  {
    id: "mf-analysis",
    name: "Mutual Fund Analysis",
    desc: "Fund performance comparison, expense ratio analysis, and portfolio overlap detection",
    icon: PieChart,
    prompt:
      "Analyse my mutual funds — performance, expense ratios and overlap.",
  },
  {
    id: "portfolio-analysis",
    name: "Portfolio Analysis",
    desc: "Comprehensive portfolio review with risk assessment and optimization suggestions",
    icon: BarChart3,
    prompt: "Give me a comprehensive portfolio analysis with risk assessment.",
  },
];
