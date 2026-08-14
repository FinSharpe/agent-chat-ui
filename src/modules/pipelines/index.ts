/**
 * Pipelines — the research-report product (implementation plan Phase 10).
 *
 * Public API of the module. Everything the app router, the Discover page and
 * the chat renderer need; nothing else reaches inside.
 */

export { ResearchCatalogPage } from "./components/catalog/ResearchCatalogPage";
export { QuoteScreen } from "./components/quote/QuoteScreen";
export { RunScreen } from "./components/run/RunScreen";
export { ReportScreen } from "./components/report/ReportScreen";
export { SharedReportScreen } from "./components/shared-view/SharedReportScreen";
export { LibraryScreen } from "./components/library/LibraryScreen";
export { ResearchReportsCard } from "./components/catalog/ResearchReportsCard";
export { PipelineSummaryCardView } from "./components/chat/PipelineSummaryCardView";
export { readSummaryCard } from "./utils/summary-card";

export { researchRoutes } from "./constants/routes";
export type {
  CatalogEntry,
  OwnedPurchase,
  PipelineSummaryCard,
  ReportDocument,
  RunStatusResponse,
} from "./types/pipelines.types";
