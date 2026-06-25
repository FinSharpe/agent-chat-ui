"use client";
import { MFPortfolioAnalyticsTabs } from "@/modules/core/portfolio/mf-portfolio/components/MFPortfolioAnalyticsTabs";
import { useMutualFundsAnalytics } from "../../MutualFundsPreviewModal/hooks/useMutualFundsAnalytics";
import { createAnalyticsPanel } from "./AnalyticsPanel";

/**
 * "Analyze Portfolio" panel backed by the MF Portfolio Analytics API. Used by
 * both Mutual Funds and ETF (the API works on isin + quantity).
 */
export const MfAnalyticsPanel = createAnalyticsPanel(
  useMutualFundsAnalytics,
  MFPortfolioAnalyticsTabs,
);
