"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Coins, Library } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { creditsLabel } from "../../constants/presentation";
import { researchRoutes } from "../../constants/routes";
import { usePipelineCatalog } from "../../hooks/usePipelineQueries";
import type { CatalogEntry } from "../../types/pipelines.types";
import { needsSymbol, stepsAreOrdered } from "../../utils/target";
import { ResearchShell } from "../shared/ResearchShell";
import { StepList } from "../shared/StepList";
import { PipelineFeaturePanel } from "./PipelineFeaturePanel";

/**
 * One Pipeline in the grid.
 *
 * The card names its Steps rather than counting them: with more than one
 * product on the screen, what the price buys is the thing being compared. The
 * whole card is the control, so the action is stated rather than nested as a
 * second button inside it — and what it says comes off the Pipeline's declared
 * target: autopilot has nothing to pick, so it offers Run.
 */
function PipelineCard({ entry }: { entry: CatalogEntry }) {
  const router = useRouter();
  const ordered = stepsAreOrdered(entry);
  const wantsSymbol = needsSymbol(entry);

  return (
    <button
      type="button"
      // Both kinds land on the quote: the picker a stock Pipeline needs lives
      // there, and a market Pipeline has nothing to pick on the way.
      onClick={() => router.push(researchRoutes.quote(entry.id))}
      className="border-border-default bg-bg-card flex h-full flex-col rounded-xl border p-5 text-left transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-text-primary font-medium">{entry.name}</h3>
        <span className="text-text-secondary inline-flex shrink-0 items-center gap-1 text-xs">
          <Coins className="text-accent-amber size-3.5" />
          {creditsLabel(entry.price_credits)}
        </span>
      </div>
      <p className="text-text-secondary mt-2 text-sm">{entry.description}</p>

      {(entry.steps?.length ?? 0) > 0 && (
        <div className="mt-4 flex-1">
          <p className="text-text-tertiary text-[11px] font-medium tracking-wide uppercase">
            {ordered ? "In this order" : "What you get"}
          </p>
          <StepList
            steps={entry.steps!}
            ordered={ordered}
            className="mt-2 space-y-1.5"
          />
        </div>
      )}

      <span className="text-primary mt-5 inline-flex items-center gap-1.5 text-sm font-medium">
        {wantsSymbol ? "Choose a stock" : "Run"}
        <ArrowRight className="size-4" />
      </span>
    </button>
  );
}

export function ResearchCatalogPage() {
  const { data: catalog, isLoading, error } = usePipelineCatalog();

  return (
    <ResearchShell
      title="Research Reports"
      subtitle="Commission a full research report — on a stock, or on the whole market. Each one is produced once, then frozen."
      backHref="/discover"
      backLabel="Discover"
      actions={
        <Button
          asChild
          variant="outline"
        >
          <Link href={researchRoutes.library}>
            <Library className="size-4" />
            Your reports
          </Link>
        </Button>
      }
    >
      {isLoading && <Skeleton className="h-72 w-full rounded-xl" />}

      {error && (
        <p className="border-error-border bg-error-bg text-error-fg rounded-lg border px-4 py-3 text-sm">
          The report catalog could not be loaded. Please try again.
        </p>
      )}

      {catalog && catalog.length === 0 && (
        <p className="border-border-default bg-bg-card text-text-tertiary rounded-lg border px-4 py-8 text-center text-sm">
          No research reports are available right now.
        </p>
      )}

      {/* One Pipeline is a product panel; several are a grid. */}
      {catalog && catalog.length === 1 && (
        <PipelineFeaturePanel entry={catalog[0]} />
      )}

      {catalog && catalog.length > 1 && (
        <div className="grid gap-4 md:grid-cols-2">
          {catalog.map((entry) => (
            <PipelineCard
              key={entry.id}
              entry={entry}
            />
          ))}
        </div>
      )}
    </ResearchShell>
  );
}
