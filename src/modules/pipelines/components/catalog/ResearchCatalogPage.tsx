"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Coins, Library } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { creditsLabel } from "../../constants/presentation";
import { researchRoutes } from "../../constants/routes";
import { usePipelineCatalog } from "../../hooks/usePipelineQueries";
import type { CatalogEntry } from "../../types/pipelines.types";
import { ResearchShell } from "../shared/ResearchShell";
import { PipelineFeaturePanel } from "./PipelineFeaturePanel";

function PipelineCard({ entry }: { entry: CatalogEntry }) {
  const router = useRouter();
  return (
    <button
      type="button"
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
      <p className="text-text-secondary mt-2 flex-1 text-sm">
        {entry.description}
      </p>
      <p className="text-text-tertiary mt-4 text-xs">
        {entry.steps?.length ?? 0} sections
      </p>
    </button>
  );
}

export function ResearchCatalogPage() {
  const { data: catalog, isLoading, error } = usePipelineCatalog();

  return (
    <ResearchShell
      title="Research Reports"
      subtitle="Commission a full research report on a stock. Each one is produced once, then frozen."
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
