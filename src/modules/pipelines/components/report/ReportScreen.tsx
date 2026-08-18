"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PipelineApiError, reportPdfUrl } from "../../api/pipelines-client";
import { formatTimestamp } from "../../constants/presentation";
import { researchRoutes } from "../../constants/routes";
import {
  useOwnedReports,
  usePipelineReport,
} from "../../hooks/usePipelineQueries";
import { targetLabel } from "../../utils/target";
import { ResearchShell } from "../shared/ResearchShell";
import { ReportDocumentView } from "./ReportDocumentView";
import { ShareDialog } from "./ShareDialog";

/**
 * The report as its purchaser meets it.
 *
 * Share is addressed to a Purchase, not a Run — two people can hold purchases
 * on one content-keyed Run, and each shares their own. The report route only
 * carries the run id, so the owning Purchase is looked up on the owned list
 * (already cached) rather than inventing a route for it.
 */
export function ReportScreen({ runId }: { runId: string }) {
  const { data, isLoading, error } = usePipelineReport(runId);
  const { data: owned } = useOwnedReports();

  const purchase = owned?.find((row) => row.run_id === runId);
  const document = data?.document;
  const about = document ? targetLabel(document.target) : "";

  return (
    <ResearchShell
      wide
      title={about ? `${about} — research report` : "Research report"}
      subtitle={
        document
          ? `Published ${formatTimestamp(document.published_at)}`
          : undefined
      }
      backHref={researchRoutes.library}
      backLabel="Your reports"
      actions={
        document ? (
          <>
            <Button
              asChild
              variant="outline"
              size="sm"
            >
              <a href={reportPdfUrl(runId)}>
                <Download className="size-4" />
                PDF
              </a>
            </Button>
            {purchase && (
              <ShareDialog
                purchaseId={purchase.purchase_id}
                isShared={!!purchase.shared}
              />
            )}
          </>
        ) : null
      }
    >
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}

      {error && (
        <p className="border-error-border bg-error-bg text-error-fg rounded-lg border px-4 py-3 text-sm">
          {error instanceof PipelineApiError && error.isNotFound
            ? "This report is not one of yours, or has not published yet."
            : "The report could not be loaded."}
        </p>
      )}

      {document && <ReportDocumentView document={document} />}
    </ResearchShell>
  );
}
