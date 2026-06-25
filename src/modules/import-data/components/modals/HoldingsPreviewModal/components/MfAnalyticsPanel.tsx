"use client";
import { useMutualFundsAnalytics } from "../../MutualFundsPreviewModal/hooks/useMutualFundsAnalytics";
import { createAnalyticsPanel } from "./AnalyticsPanel";
import { MFAnalysisDashboard } from "./MFAnalysisDashboard";

/**
 * Analysis canvas backed by the MF Portfolio Analytics API. Used by both Mutual
 * Funds and ETF (the API works on isin + quantity). Flat dashboard leading with
 * returns + Performance/Risk scores, then allocation and cost.
 */
export const MfAnalyticsPanel = createAnalyticsPanel(
  useMutualFundsAnalytics,
  MFAnalysisDashboard,
);
