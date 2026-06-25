"use client";
import { PortfolioAnalyticsTabs } from "@/modules/core/portfolio/components/PortfolioAnalyticsTabs";
import { useEquitiesAnalytics } from "../../EquitiesPreviewModal/hooks/useEquitiesAnalytics";
import { createAnalyticsPanel } from "./AnalyticsPanel";

/**
 * "Analyze Portfolio" panel for equity holdings (Portfolio Analytics API).
 */
export const EquitiesAnalyticsPanel = createAnalyticsPanel(
  useEquitiesAnalytics,
  PortfolioAnalyticsTabs,
);
