"use client";
import { useEquitiesAnalytics } from "../../EquitiesPreviewModal/hooks/useEquitiesAnalytics";
import { createAnalyticsPanel } from "./AnalyticsPanel";
import { EquityAnalysisDashboard } from "./EquityAnalysisDashboard";

/**
 * Analysis canvas for equity holdings (Portfolio Analytics API) — a flat
 * dashboard leading with returns + FinSharpe/Risk scores.
 */
export const EquitiesAnalyticsPanel = createAnalyticsPanel(
  useEquitiesAnalytics,
  EquityAnalysisDashboard,
);
