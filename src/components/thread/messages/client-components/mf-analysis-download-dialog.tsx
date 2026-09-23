"use client";

import { ReportDownloadDialog, type ReportSection } from "./report-download-dialog";

const MF_SECTIONS: ReportSection[] = [
  { key: "fund_overview", label: "Fund Overview" },
  { key: "performance", label: "Performance" },
  { key: "ratios", label: "Ratios" },
  { key: "portfolio", label: "Portfolio" },
  { key: "peer_comparison", label: "Peer Comparison" },
  { key: "finsharpe_analysis", label: "FinSharpe Analysis" },
  { key: "outlook", label: "Outlook" },
];

interface MfAnalysisDownloadDialogProps {
  threadId: string | null;
  analysisId: string;
  schemeName?: string;
  triggerClassName?: string;
}

export function MfAnalysisDownloadDialog({
  threadId,
  analysisId,
  schemeName,
  triggerClassName,
}: MfAnalysisDownloadDialogProps) {
  return (
    <ReportDownloadDialog
      threadId={threadId}
      analysisId={analysisId}
      sections={MF_SECTIONS}
      analysisType="mf_analysis"
      fileBaseName={schemeName || "mutual_fund"}
      triggerClassName={triggerClassName}
    />
  );
}
