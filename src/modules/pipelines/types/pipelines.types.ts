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
  TableColumn,
  TableSpec,
  VintageStamp,
} from "@/api/generated/pipelines-apis/models";

/** Run lifecycle, as `pipeline_runs.status` spells it. */
export type RunStatus =
  | "queued"
  | "running"
  | "published"
  | "failed"
  | "cancelled";

/**
 * Per-step status. `coverage_gap` and `not_wired` are first-class, not
 * absences: the first was never scheduled because the stock is out of the
 * step's reach, the second because the step has not been built yet.
 */
export type StepStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "coverage_gap"
  | "not_wired";

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

/** One Section as the Summary Card carries it: enough to name it and to say
 * whether it produced anything. The full Section lives in the Report. */
export interface PipelineSummaryCardSection {
  step_id: string;
  /** Carried because an absent Section has no headline to name itself with. */
  title: string;
  /** succeeded | failed | coverage_gap | not_wired. */
  status: string;
  /** Empty for every Section that produced nothing. */
  headline: string;
}

/**
 * The Summary Card as `pipelines/delivery.py` writes it into a thread, under
 * `additional_kwargs.pipeline_summary_card`. Not an endpoint response — the
 * chat renderer is the only reader, and it meets the card as loose JSON.
 */
export interface PipelineSummaryCard {
  run_id: string;
  pipeline_id: string;
  target: {
    symbol?: string;
    fincode?: number;
    kind?: string;
    market?: string;
  };
  stance: { value: string; label: string };
  degraded: boolean;
  coverage_gaps: string[];
  /** step_id -> headline, in the document's section order. */
  headlines: Record<string, string>;
  /**
   * Every Section the Report froze, in manifest order, with its status —
   * absences included. `headlines` above cannot carry one, so a `not_wired`
   * Section used to fall out of the card and the card read as a Run that
   * fully succeeded.
   *
   * Empty on a card delivered before the server carried it. The renderer
   * falls back to `headlines` there rather than showing an empty card: a card
   * is a frozen notice sitting in a thread, and an old one still gets read.
   */
  sections: PipelineSummaryCardSection[];
  published_at?: string | null;
  report_path: string;
}

/** The public shared view: `GET /api/shared/reports/{token}`. */
export interface SharedReportResponse {
  document: import("@/api/generated/pipelines-apis/models").ReportDocument;
  disclaimer: string;
  view_count: number;
}
