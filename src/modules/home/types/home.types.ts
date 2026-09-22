import type { LucideIcon } from "lucide-react";

/** Where a Home card sends the user. `discover-ideas` deep-links into
 *  Discover's strategies view; `guide` opens the in-app guide popup. */
export type CardAction =
  | "chat"
  | "import"
  | "discover"
  | "discover-ideas"
  | "memory"
  | "guide";

/** Anything a Home card can act on — a destination plus an optional seed
 *  prompt for "chat" actions. */
export interface ActionTarget {
  title: string;
  action: CardAction;
  /** First message of the fresh chat. Without one, "chat" opens an empty
   *  chat rather than sending the card's title. */
  prompt?: string;
}

export interface FeatureCard extends ActionTarget {
  tag: string;
  desc: string;
  cta: string;
  icon: LucideIcon;
}

export interface WhatYouCanDoCard extends ActionTarget {
  desc: string;
  cta: string;
  icon: LucideIcon;
}

export interface StarterQuestion {
  task: string;
  category: string;
  icon: LucideIcon;
}

export interface GuideStep {
  title: string;
  body: string;
}

export interface GuideSection {
  id: string;
  level: "Start here" | "Go deeper" | "Advanced";
  icon: LucideIcon;
  title: string;
  summary: string;
  steps: GuideStep[];
  tip?: string;
}
