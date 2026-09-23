import type { LucideIcon } from "lucide-react";
import {
  Blocks,
  Globe,
  Lightbulb,
  LineChart,
  Newspaper,
  Rocket,
  Workflow,
} from "lucide-react";
import { DiscoverFeature } from "../types/discover.types";

export interface DiscoverNavCard {
  id: DiscoverFeature;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

/**
 * The landing's live feature rows — every one of these opens something real.
 *
 * Build Your Own Portfolios sat under "Coming Soon" while the rest of that
 * group was mock; it runs on the real basket APIs, so it belongs here (T-04).
 * IPO Watch is new (T-07) and takes the fourth slot, as it does in
 * finsharpe-mobile.
 */
export const discoverNavCards: DiscoverNavCard[] = [
  {
    id: "news",
    title: "News Impact",
    subtitle: "Trending topics & market themes",
    icon: Newspaper,
  },
  {
    id: "ideas",
    title: "Explore Investment Ideas",
    subtitle: "Curated baskets & strategies",
    icon: Lightbulb,
  },
  {
    id: "workflows",
    title: "Agent Workflows",
    subtitle: "Deep agent research pipelines",
    icon: Workflow,
  },
  {
    id: "ipos",
    title: "IPO Watch",
    subtitle: "Open & upcoming issues",
    icon: Rocket,
  },
  {
    id: "builder",
    title: "Build Your Own Portfolios",
    subtitle: "Create custom baskets",
    icon: Blocks,
  },
];

/**
 * Rows for features that do not exist yet.
 *
 * Deliberately **not** `DiscoverFeature`s: the screens behind these two were
 * invented content (13 algorithms with annualised returns and win rates; seven
 * ETF baskets with 1Y/3Y figures) and have been deleted, so there is no
 * `?feature=` route to reach and the rows cannot be tapped. They stay on the
 * page as a statement of what is coming, and read as plainly disabled.
 */
export interface ComingSoonCard {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

export const discoverComingSoonCards: ComingSoonCard[] = [
  {
    id: "trading",
    title: "Explore Trading Ideas",
    subtitle: "Algorithmic strategies for every market",
    icon: LineChart,
  },
  {
    id: "global",
    title: "Global Investing",
    subtitle: "Thematic ETF baskets · International markets",
    icon: Globe,
  },
];

/** Features that live on their own routes rather than inside Discover. */
export const DISCOVER_ROUTE_FEATURES: Partial<Record<DiscoverFeature, string>> =
  {
    workflows: "/discover/research",
    builder: "/discover/create-basket",
  };
