import type { ComponentType } from "react";
import { BarChart3, PieChart, TrendingUp } from "lucide-react";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { EquitiesAnalyticsPanel } from "./components/EquitiesAnalyticsPanel";
import { MfAnalyticsPanel } from "./components/MfAnalyticsPanel";
import type { AnalyticsPanelComponent } from "./components/analytics-panel.types";

/**
 * Per-ConsentType configuration for the editable holdings preview modal. The
 * editable asset types (Equities, ETF, Mutual Funds) share one modal/form/hook;
 * only these fields differ. (SIP and Bank Accounts are read-only and keep their
 * own modals.)
 */
export type EditableHoldingsConfig = {
  consentType: ConsentType;
  /** Dialog title, e.g. "Equity Holdings Preview". */
  title: string;
  /** Dialog description shown under the title. */
  description: string;
  /** Lowercase label for the loading text + error state, e.g. "equity holdings". */
  assetLabel: string;
  /** Uppercase eyebrow above the workspace title, e.g. "Import · Demat Holdings". */
  eyebrow: string;
  /** Show the summed current value in the summary card (ETF only). */
  showCurrentValue?: boolean;
  /** Icon shown in the modal header chip. */
  icon: ComponentType<{ className?: string }>;
  /** Asset-specific "Analyze Portfolio" panel. */
  AnalyticsPanel: AnalyticsPanelComponent;
};

export const EQUITIES_CONFIG: EditableHoldingsConfig = {
  consentType: ConsentType.EQUITIES,
  title: "Equity Holdings",
  description:
    "Review, edit quantities, or add new equity holdings before analysis",
  assetLabel: "equity holdings",
  eyebrow: "Import · Demat Holdings",
  icon: BarChart3,
  AnalyticsPanel: EquitiesAnalyticsPanel,
};

export const ETF_CONFIG: EditableHoldingsConfig = {
  consentType: ConsentType.ETF,
  title: "ETF Holdings",
  description:
    "Review, edit quantities, or add new ETF holdings before analysis",
  assetLabel: "ETF holdings",
  eyebrow: "Import · ETF Holdings",
  showCurrentValue: true,
  icon: TrendingUp,
  // The MF Portfolio Analytics API works on isin + quantity, so ETF reuses it.
  AnalyticsPanel: MfAnalyticsPanel,
};

export const MUTUAL_FUNDS_CONFIG: EditableHoldingsConfig = {
  consentType: ConsentType.MUTUAL_FUNDS,
  title: "Mutual Fund Holdings",
  description:
    "Review, edit quantities, or add new mutual fund holdings before analysis",
  assetLabel: "mutual fund holdings",
  eyebrow: "Import · Mutual Fund Holdings",
  icon: PieChart,
  AnalyticsPanel: MfAnalyticsPanel,
};
