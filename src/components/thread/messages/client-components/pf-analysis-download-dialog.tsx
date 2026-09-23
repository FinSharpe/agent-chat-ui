"use client";

import { ReportDownloadDialog, type ReportSection } from "./report-download-dialog";

const PF_SECTIONS: ReportSection[] = [
  { key: "finsharpe_analysis", label: "FinSharpe Analysis" },
  { key: "performance_analysis", label: "Performance Analysis" },
  { key: "monthly_returns", label: "Monthly Returns Heatmap" },
  { key: "summary", label: "Summary" },
  { key: "recommendation", label: "Expert Recommendations" },
  { key: "portfolio_overview", label: "Portfolio Overview" },
  { key: "risk_assessment", label: "Risk Assessment" },
  { key: "drawdown", label: "Drawdown Analysis" },
  { key: "risk_adjusted_returns", label: "Risk-Adjusted Returns" },
  { key: "correlation", label: "Correlation Analysis" },
];

interface PfAnalysisDownloadDialogProps {
  threadId: string | null;
  analysisId: string;
  portfolioName?: string;
  triggerClassName?: string;
}

export function PfAnalysisDownloadDialog({
  threadId,
  analysisId,
  portfolioName,
  triggerClassName,
}: PfAnalysisDownloadDialogProps) {
  return (
    <ReportDownloadDialog
      threadId={threadId}
      analysisId={analysisId}
      sections={PF_SECTIONS}
      analysisType="pf_analysis"
      fileBaseName={portfolioName || "portfolio"}
      triggerClassName={triggerClassName}
    />
  );
}
