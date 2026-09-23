"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { PopupFrame } from "@/components/shared/Popup";
import { researchRoutes } from "../../constants/routes";
import { useDesktopLayout } from "../../hooks/useDesktopLayout";
import { ResearchCatalogPage } from "../catalog/ResearchCatalogPage";
import { ResearchPage } from "./ResearchPage";

const FLOW_PREFIXES = [
  `${researchRoutes.catalog}/quote/`,
  `${researchRoutes.catalog}/run/`,
];

/**
 * Hosts the Agent Workflows catalog and its run flow (quote → run).
 *
 * The reference opens a workflow's run view over the list it came from: a
 * popup on desktop, a full-screen swap on a phone. The flow here is routed
 * (a run is deep-linkable and survives a reload), so the catalog is rendered
 * by this host rather than by its page — that keeps one catalog mounted
 * beneath the popup while the route moves from the catalog to the quote to
 * the run, and the popup itself stays up across that move instead of closing
 * and reopening between screens.
 *
 * Every other research route (the report, the library) is a page of its own
 * and passes straight through.
 */
export function ResearchSection({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const desktop = useDesktopLayout();

  const isCatalog = pathname === researchRoutes.catalog;
  const isFlow = FLOW_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isCatalog && !isFlow) return <>{children}</>;

  if (!desktop) {
    // A phone swaps the list for the run view outright, as the reference does.
    return isCatalog ? (
      <ResearchPage>
        <ResearchCatalogPage />
      </ResearchPage>
    ) : (
      <ResearchPage animate={false}>{children}</ResearchPage>
    );
  }

  return (
    <>
      <ResearchPage>
        <ResearchCatalogPage />
      </ResearchPage>
      <AnimatePresence>
        {isFlow && (
          <PopupFrame
            key="research-flow"
            onClose={() => router.push(researchRoutes.catalog)}
          >
            {children}
          </PopupFrame>
        )}
      </AnimatePresence>
    </>
  );
}
