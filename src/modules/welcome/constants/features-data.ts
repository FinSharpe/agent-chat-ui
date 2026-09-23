import {
  Bot,
  Compass,
  ShieldCheck,
  BarChart3,
  Brain,
  Lightbulb,
  FileText,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string; // Tailwind bg class for the icon circle
  iconColor: string; // Tailwind text class for the icon
}

/**
 * The eight cards on the public marketing page.
 *
 * Every line is held to what the product actually ships (T-05): no "learns
 * about you", no cross-chat recall, no promise that Discover is personalised,
 * and no encryption figure — the app's own security posture is not something
 * this page can state as a number.
 */
export const features: Feature[] = [
  {
    icon: Bot,
    title: "Ask in Plain English",
    description:
      "Ask about a stock, a fund or your own holdings the way you would ask a person, and get a worked answer back.",
    color: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: Compass,
    title: "Investment Discovery",
    description:
      "Browse strategies from FinSharpe's research desk, the day's market news and the open and upcoming IPOs.",
    color: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    icon: ShieldCheck,
    title: "Secure Data Import",
    description:
      "Import your holdings through the RBI-regulated Account Aggregator framework, with read-only access.",
    color: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: BarChart3,
    title: "Portfolio Analytics",
    description:
      "See allocation, concentration and risk across everything you hold, per account or all of it together.",
    color: "bg-teal-100",
    iconColor: "text-teal-600",
  },
  {
    icon: Brain,
    title: "Chat History",
    description:
      "Every conversation is saved and searchable. Rename the ones worth keeping and bookmark them to the top.",
    color: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  {
    icon: Lightbulb,
    title: "Adviser Strategies",
    description:
      "Investment strategies published by FinSharpe's advisers, with the holdings behind each one.",
    color: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    icon: FileText,
    title: "Research Reports",
    description:
      "Run a multi-step agent workflow and get a written report at the end, saved to your library.",
    color: "bg-red-100",
    iconColor: "text-red-600",
  },
  {
    icon: Smartphone,
    title: "Works on Any Screen",
    description:
      "The same app on desktop and phone — pick up a conversation wherever you left it.",
    color: "bg-sky-100",
    iconColor: "text-sky-600",
  },
];

export interface ShowcaseFeature {
  title: string;
  description: string;
  bullets: string[];
  gradient: string; // Tailwind gradient classes for the visual placeholder
  iconBg: string;
  icon: LucideIcon;
}

/** The three long-form blocks. Same rule as `features`: each bullet names
 *  something in the product, not a capability we would like it to have. */
export const showcaseFeatures: ShowcaseFeature[] = [
  {
    title: "A Conversation About Your Money",
    description:
      "Ask questions about markets, funds and your own holdings, and get explanations in plain language — with the data the answer was built from shown alongside it.",
    bullets: [
      "Natural-language questions on stocks and funds",
      "Answers grounded in live Indian market data",
      "Sources shown with the answer",
      "Follow-up suggestions that keep the thread's context",
    ],
    gradient: "from-blue-500 to-indigo-600",
    iconBg: "bg-blue-100",
    icon: Bot,
  },
  {
    title: "Discover Your Next Investment",
    description:
      "Screen the Indian market on the numbers that matter to you, follow the day's headlines and the IPO calendar, and read the strategies FinSharpe's advisers publish.",
    bullets: [
      "Stock and mutual-fund screening",
      "Strategies published by FinSharpe's advisers",
      "Market news and the IPO calendar",
      "Build a custom basket to your own rules",
    ],
    gradient: "from-purple-500 to-pink-600",
    iconBg: "bg-purple-100",
    icon: Compass,
  },
  {
    title: "Secure & Effortless Data Import",
    description:
      "Connect your accounts through India's RBI-regulated Account Aggregator framework. Access is read-only: FinSharpe can see your holdings, never move them.",
    bullets: [
      "RBI-regulated Account Aggregator framework",
      "Read-only access to holdings — no transactions",
      "Demat, mutual funds and bank accounts",
      "Disconnect any account at any time",
    ],
    gradient: "from-green-500 to-emerald-600",
    iconBg: "bg-green-100",
    icon: ShieldCheck,
  },
];
