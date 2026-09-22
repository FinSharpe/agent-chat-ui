import type { LucideIcon } from "lucide-react";
import {
  Blocks,
  Globe,
  Lightbulb,
  LineChart,
  Newspaper,
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
 * The landing's feature rows. The first three are live; the rest sit under
 * "Coming Soon" — keep the featured three first.
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
    id: "builder",
    title: "Build Your Own Portfolios",
    subtitle: "Create custom baskets",
    icon: Blocks,
  },
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
