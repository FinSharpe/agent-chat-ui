import type { ComponentType } from "react";
import type { HoldingWithQuantity } from "../utils/holdings-transformer";

/**
 * Props for an asset-specific analytics panel (the "Analyze Portfolio" button +
 * results). Each asset class owns its own analytics hook and result component;
 * the generic form just renders the configured panel.
 */
export type AnalyticsPanelProps = {
  /** Current number of holdings (used to reset stale analytics on add/remove). */
  holdingsCount: number;
  /** Read the live form holdings at click time. */
  getHoldings: () => HoldingWithQuantity[];
};

export type AnalyticsPanelComponent = ComponentType<AnalyticsPanelProps>;
