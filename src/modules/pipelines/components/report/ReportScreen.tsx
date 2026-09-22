"use client";

import { useRouter } from "next/navigation";
import { Download } from "lucide-react";

import FeatureHeader from "@/components/discover/FeatureHeader";
import { PipelineApiError, reportPdfUrl } from "../../api/pipelines-client";
import { formatTimestamp } from "../../constants/presentation";
import { researchRoutes } from "../../constants/routes";
import {
  useOwnedReports,
  usePipelineCatalog,
  usePipelineReport,
} from "../../hooks/usePipelineQueries";
import { targetLabel } from "../../utils/target";
import { CIRCLE_BUTTON, Placeholder, SCROLL_BODY } from "../shared/kit";
import { ResearchPage } from "../shared/ResearchPage";
import { ReportDocumentView } from "./ReportDocumentView";
import { ShareDialog } from "./ShareDialog";

/**
 * The report as its purchaser meets it — a Discover feature page: the
 * header carries the share and PDF actions, the frozen document scrolls
 * beneath it in the centred column.
 *
 * Share is addressed to a Purchase, not a Run — two people can hold purchases
 * on one content-keyed Run, and each shares their own. The report route only
 * carries the run id, so the owning Purchase is looked up on the owned list
 * (already cached) rather than inventing a route for it.
 */
export function ReportScreen({ runId }: { runId: string }) {
  const router = useRouter();
  const { data, isLoading, error } = usePipelineReport(runId);
  const { data: owned } = useOwnedReports();
  const { data: catalog } = usePipelineCatalog();

  const purchase = owned?.find((row) => row.run_id === runId);
  const document = data?.document;
  const about = document ? targetLabel(document.target) : "";
  const pipelineName =
    catalog?.find((entry) => entry.id === document?.pipeline_id)?.name ??
    purchase?.pipeline_name;

  const subtitle = document
    ? [about, `Published ${formatTimestamp(document.published_at)}`]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  return (
    <ResearchPage>
      <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-transparent">
        <FeatureHeader
          title={pipelineName ?? "Research Report"}
          subtitle={subtitle}
          onBack={() => router.push(researchRoutes.library)}
          right={
            document ? (
              <div className="flex items-center gap-1.5">
                {purchase && (
                  <ShareDialog
                    purchaseId={purchase.purchase_id}
                    isShared={!!purchase.shared}
                  />
                )}
                <a
                  href={reportPdfUrl(runId)}
                  className={CIRCLE_BUTTON}
                  title="Download PDF"
                  aria-label="Download PDF"
                >
                  <Download size={14} />
                </a>
              </div>
            ) : undefined
          }
        />

        <div className={`${SCROLL_BODY} space-y-5`}>
          {isLoading && (
            <div className="space-y-4">
              <Placeholder className="rounded-card h-[200px] w-full" />
              <Placeholder className="rounded-card h-64 w-full" />
            </div>
          )}

          {error && (
            <p className="text-[11px] text-rose-500">
              {error instanceof PipelineApiError && error.isNotFound
                ? "This report is not one of yours, or has not published yet."
                : "The report could not be loaded."}
            </p>
          )}

          {document && <ReportDocumentView document={document} />}
        </div>
      </div>
    </ResearchPage>
  );
}
