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
  /** Show the summed current value in the summary card (ETF only). */
  showCurrentValue?: boolean;
  /** Asset-specific "Analyze Portfolio" panel. */
  AnalyticsPanel: AnalyticsPanelComponent;
};

export const EQUITIES_CONFIG: EditableHoldingsConfig = {
  consentType: ConsentType.EQUITIES,
  title: "Equity Holdings Preview",
  description:
    "Review, edit quantities, or add new equity holdings before analysis",
  assetLabel: "equity holdings",
  AnalyticsPanel: EquitiesAnalyticsPanel,
};

export const ETF_CONFIG: EditableHoldingsConfig = {
  consentType: ConsentType.ETF,
  title: "ETF Holdings Preview",
  description:
    "Review, edit quantities, or add new ETF holdings before analysis",
  assetLabel: "ETF holdings",
  showCurrentValue: true,
  // The MF Portfolio Analytics API works on isin + quantity, so ETF reuses it.
  AnalyticsPanel: MfAnalyticsPanel,
};

export const MUTUAL_FUNDS_CONFIG: EditableHoldingsConfig = {
  consentType: ConsentType.MUTUAL_FUNDS,
  title: "Mutual Fund Holdings Preview",
  description:
    "Review, edit quantities, or add new mutual fund holdings before analysis",
  assetLabel: "mutual fund holdings",
  AnalyticsPanel: MfAnalyticsPanel,
};
