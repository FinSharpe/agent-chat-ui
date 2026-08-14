/**
 * The Pipelines wire, named for the UI.
 *
 * Everything here is the generated contract from `src/api/generated/pipelines-apis`
 * re-exported under the domain name it carries in the design record — the
 * generated names are orval's, and a component reading `ReportDocument` should
 * not have to know which file orval put it in.
 *
 * UI-only shapes (the Summary Card the chat renderer meets, the run-poll
 * outcome) live here too, because no endpoint returns them.
 */

export type {
  CatalogEntry,
  CatalogStep,
  ChartSeries,
  ChartSpec,
  CoverageGapNotice,
  OwnedPurchase,
  PurchaseResponse,
  QuoteResponse,
  ReportDocument,
  ReportSection,
  RunStatusResponse,
  SectionBadge,
  ShareResponse,
  Stance,
  StepOutput,
  StepState,
  VintageStamp,
} from "@/api/generated/pipelines-apis/models";

/** Run lifecycle, as `pipeline_runs.status` spells it. */
export type RunStatus =
  | "queued"
  | "running"
  | "published"
  | "failed"
  | "cancelled";

/** Per-step status. `coverage_gap` is first-class, not an absence. */
export type StepStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "coverage_gap";

/** The three-level Section Badge scale. */
export type BadgeValue = "positive" | "neutral" | "caution";

/** The report-level verdict. */
export type StanceValue = "constructive" | "balanced" | "cautious";

export const TERMINAL_RUN_STATUSES: readonly string[] = [
  "published",
  "failed",
  "cancelled",
];

export function isRunTerminal(status: string | undefined): boolean {
  return !!status && TERMINAL_RUN_STATUSES.includes(status);
}

/**
 * The Summary Card as `pipelines/delivery.py` writes it into a thread, under
 * `additional_kwargs.pipeline_summary_card`. Not an endpoint response — the
 * chat renderer is the only reader, and it meets the card as loose JSON.
 */
export interface PipelineSummaryCard {
  run_id: string;
  pipeline_id: string;
  target: { symbol?: string; fincode?: number };
  stance: { value: string; label: string };
  degraded: boolean;
  coverage_gaps: string[];
  /** step_id -> headline, in the document's section order. */
  headlines: Record<string, string>;
  published_at?: string | null;
  report_path: string;
}

/** The public shared view: `GET /api/shared/reports/{token}`. */
export interface SharedReportResponse {
  document: import("@/api/generated/pipelines-apis/models").ReportDocument;
  disclaimer: string;
  view_count: number;
}
