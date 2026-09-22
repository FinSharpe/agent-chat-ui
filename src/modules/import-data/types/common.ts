/**
 * Common types shared across all consent types
 */

import type { ConsentRecord } from "./aa";

/**
 * Base holding type with fields common to all asset types
 */
export interface BaseHolding {
  ucc: string;
  isin: string;
  lienUnits: string;
  registrar: string;
  FatcaStatus: string;
  lockinUnits: string;
}

/**
 * Base FI data account summary structure
 */
export interface BaseFiDataAccountSummary<THolding> {
  costValue: string;
  currentValue: string;
  Investment: {
    Holdings: {
      Holding: THolding[];
    };
  };
}

/**
 * Base account type structure
 */
export interface BaseAccountType<THolding> {
  linkReferenceNumber: string;
  maskedAccountNumber: string;
  fiType: string;
  bank: string;
  Summary?: BaseFiDataAccountSummary<THolding>;
}

/**
 * Base props for all analysis modal components
 */
export interface BaseAnalysisModalProps {
  consent?: ConsentRecord | null;
  /** Extra classes for the modal's own "Analyse" trigger pill. */
  triggerClassName?: string;
  /** Trigger text (defaults to "Analyse"). */
  triggerLabel?: string;
  /**
   * Controlled open state. Omit to let the modal's own "Analyse" pill own it;
   * supply it so the account row's body tap can open the analysis too.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Column configuration for holdings tables
 */
export interface ColumnConfig {
  key: string;
  label: string;
  align: "left" | "right" | "center";
}
