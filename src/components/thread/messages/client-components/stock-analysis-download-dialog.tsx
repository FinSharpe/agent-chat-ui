"use client";

import { ReportDownloadDialog, type ReportSection } from "./report-download-dialog";

const STOCK_SECTIONS: ReportSection[] = [
  { key: "company_overview", label: "Company Overview" },
  { key: "technical_analysis", label: "Technical Analysis" },
  { key: "fundamental_analysis", label: "Fundamental Analysis" },
  { key: "peer_comparison", label: "Peer Comparison" },
  { key: "market_sentiment", label: "Market Sentiment" },
  { key: "finsharpe_analysis", label: "FinSharpe Analysis" },
  { key: "outlook", label: "Outlook" },
];

interface StockAnalysisDownloadDialogProps {
  threadId: string | null;
  analysisId: string;
  companyName?: string;
  triggerClassName?: string;
}

export function StockAnalysisDownloadDialog({
  threadId,
  analysisId,
  companyName,
  triggerClassName,
}: StockAnalysisDownloadDialogProps) {
  return (
    <ReportDownloadDialog
      threadId={threadId}
      analysisId={analysisId}
      sections={STOCK_SECTIONS}
      fileBaseName={companyName || "stock"}
      triggerClassName={triggerClassName}
    />
  );
}
