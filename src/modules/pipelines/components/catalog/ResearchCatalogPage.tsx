"use client";

import { useRouter } from "next/navigation";
import { Library } from "lucide-react";

import FeatureHeader from "@/components/discover/FeatureHeader";
import { PageLoaderSwitch } from "@/components/shared/PageLoader";
import SectionErrorState from "@/components/shared/SectionErrorState";
import { BANNER_WAVE, SectionBanner } from "@/components/shared/SectionKit";
// By file path, not "@/modules/credits": the barrel carries the Credits page.
import { priceLabel } from "@/modules/credits/utils/format";
import { researchRoutes } from "../../constants/routes";
import { usePipelineCatalog } from "../../hooks/usePipelineQueries";
import type { CatalogEntry } from "../../types/pipelines.types";
import { HEADER_PILL, SCROLL_BODY, StatStrip } from "../shared/kit";
import { WorkflowCard } from "./WorkflowCard";

/** Real figures for the strip under the banner. The reference quotes an
 *  average runtime; nothing on the wire measures one, so the strip spends
 *  that slot on what the catalog does declare — the entry price. */
function catalogStats(catalog: CatalogEntry[] | undefined) {
  const entries = catalog ?? [];
  const steps = entries.map((entry) => entry.steps?.length ?? 0);
  const prices = entries.map((entry) => entry.price_minor);
  const avgSteps = steps.length
    ? Math.round(steps.reduce((sum, n) => sum + n, 0) / steps.length)
    : 0;
  return [
    { label: "Pipelines", value: catalog ? `${entries.length}` : "—" },
    {
      label: "Starting At",
      value: prices.length ? priceLabel(Math.min(...prices)) : "—",
    },
    { label: "Avg Steps", value: catalog ? `${avgSteps}` : "—" },
  ];
}

/**
 * Agent Workflows — the research Pipelines as the reference presents its
 * workflow list: the Discover banner, a stat strip, then one divided card
 * with a row per Pipeline. Every row leads to the same place, the quote,
 * where a stock Pipeline asks for its stock and a market one simply runs.
 */
export function ResearchCatalogPage() {
  const router = useRouter();
  const {
    data: catalog,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = usePipelineCatalog();

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      <FeatureHeader
        title="Agent Workflows"
        subtitle="Deep agent research pipelines"
        onBack={() => router.push("/discover")}
        right={
          <button
            type="button"
            onClick={() => router.push(researchRoutes.library)}
            className={HEADER_PILL}
          >
            <Library size={14} />
            Your Reports
          </button>
        }
      />

      {/* The catalog is the page: its first load is a full-page wait under
          the header, as mobile's catalog screen (#153). */}
      <PageLoaderSwitch loading={isLoading}>
        <div className={`${SCROLL_BODY} space-y-6`}>
          <div className="space-y-3">
            <SectionBanner
              eyebrow="Agent Workflows"
              title="Multi-step AI agents chaining macro, fundamental and technical analysis"
              tone="blue"
              height={260}
              image={BANNER_WAVE.cyan}
              imageScrim
            />
            <StatStrip stats={catalogStats(catalog)} />
          </div>

          {/* A failed catalog is not an empty catalog: without this the screen
            below would claim there are no workflows to run. */}
          {isError && (
            <SectionErrorState
              label="the agent workflows"
              onRetry={() => refetch()}
              retrying={isFetching}
            />
          )}

          {catalog && catalog.length === 0 && (
            <p className="py-8 text-center text-[11px] text-slate-400">
              No agent workflows are available right now.
            </p>
          )}

          {catalog && catalog.length > 0 && (
            <div className="glass-card rounded-card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800/60">
              {catalog.map((entry) => (
                <WorkflowCard
                  key={entry.id}
                  entry={entry}
                  onRun={() => router.push(researchRoutes.quote(entry.id))}
                />
              ))}
            </div>
          )}
        </div>
      </PageLoaderSwitch>
    </div>
  );
}
