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

export interface MarketNews {
  id: string;
  category: string;
  headline: string;
  summary: string;
  source: string;
  time: string;
  sentiment: "positive" | "neutral" | "negative";
}

export interface HomeVideo {
  id: string;
  title: string;
  source: string;
  type: "Tutorial" | "Course" | "Podcast" | "Lecture" | "Webinar";
  duration: string;
  /** Thumbnail fallback when there is no image. */
  gradient: string;
  image?: string;
  description: string;
}

export type PublicationKind = "video" | "post" | "article";

export interface Publication {
  id: string;
  kind: PublicationKind;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  /** Video only. */
  duration?: string;
  /** Article only. */
  readTime?: string;
  /** Post only — a carousel of N frames, Instagram-style. */
  frames?: number;
  gradient: string;
  /** Photo/illustration cover instead of the flat gradient. */
  image?: string;
  /** Long-form body, rendered in the reader. Articles use all of it. */
  body?: string[];
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
