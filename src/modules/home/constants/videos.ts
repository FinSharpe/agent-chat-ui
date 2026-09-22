import type { HomeVideo } from "../types/home.types";

// PLACEHOLDER CONTENT — static copy from the design reference; no video catalogue or player source exists yet.
export const HOME_VIDEOS: HomeVideo[] = [
  {
    id: "v1",
    title: "Getting Started with FinSharpeGPT",
    source: "FinSharpe",
    type: "Tutorial",
    duration: "4:20",
    gradient: "linear-gradient(135deg,#063BAA,#2563EB)",
    image: "/graphics/watch-1.jpg",
    description:
      "A quick walkthrough of the app — connect your accounts, run an analysis, and start consulting the AI.",
  },
  {
    id: "v2",
    title: "Understanding Mutual Fund Overlap",
    source: "FinSharpe Academy",
    type: "Course",
    duration: "12:05",
    gradient: "linear-gradient(135deg,#0A1F4D,#063BAA)",
    image: "/graphics/watch-2.jpg",
    description:
      "Learn how overlapping holdings across funds quietly reduce diversification — and how to spot and fix it.",
  },
  {
    id: "v3",
    title: "The Psychology of Market Cycles",
    source: "FinSharpe Talks",
    type: "Podcast",
    duration: "48:30",
    gradient: "linear-gradient(135deg,#5B21B6,#7C3AED)",
    description:
      "A deep-dive podcast on investor behaviour across bull and bear markets, and how to stay disciplined.",
  },
  {
    id: "v4",
    title: "Building a Diversified Portfolio",
    source: "FinSharpe Academy",
    type: "Lecture",
    duration: "22:15",
    gradient: "linear-gradient(135deg,#0F766E,#14B8A6)",
    description:
      "A structured lecture on asset allocation and diversification for Indian investors across market caps.",
  },
  {
    id: "v5",
    title: "Tax-Saving Strategies for 2025",
    source: "FinSharpe Academy",
    type: "Course",
    duration: "15:40",
    gradient: "linear-gradient(135deg,#B45309,#F59E0B)",
    description:
      "Maximise your Section 80C and beyond with these tax-efficient investment strategies for the year.",
  },
];
