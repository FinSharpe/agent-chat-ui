/**
 * Every research URL in one place.
 *
 * The section lives under Discover — a paid research report is something you
 * discover and buy, not a setting — and each segment after `research` is
 * static so none of them can collide with `/discover/[strategy]`.
 *
 * The shared view is the exception: it is outside `/discover` entirely,
 * because its reader has no account, no navigation, and no reason to meet the
 * rest of the product before they have read the report.
 */

export const researchRoutes = {
  catalog: "/discover/research",
  library: "/discover/research/library",
  quote: (pipelineId: string, symbol?: string) =>
    symbol
      ? `/discover/research/quote/${pipelineId}?symbol=${encodeURIComponent(symbol)}`
      : `/discover/research/quote/${pipelineId}`,
  // `label` only ever labels the page — a ticker for a stock report, the
  // market for a market one. Nothing depends on it, which is why it may be
  // omitted and why the run view falls back to the owned list for the name.
  run: (runId: string, label?: string) =>
    label
      ? `/discover/research/run/${runId}?target=${encodeURIComponent(label)}`
      : `/discover/research/run/${runId}`,
  report: (runId: string) => `/discover/research/report/${runId}`,
  shared: (token: string) => `/shared/reports/${token}`,
};
