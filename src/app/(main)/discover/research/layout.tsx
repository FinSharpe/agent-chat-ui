"use client";

import type { ReactNode } from "react";

import { ResearchSection } from "@/modules/pipelines";

/**
 * Agent Workflows. The section host renders the catalog itself, so it can
 * stay mounted under the quote/run popup on desktop — see ResearchSection.
 */
export default function ResearchLayout({ children }: { children: ReactNode }) {
  return <ResearchSection>{children}</ResearchSection>;
}
