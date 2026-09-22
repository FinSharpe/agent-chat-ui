/**
 * Common types shared across all consent types
 */

import { ConsentData } from "@/lib/moneyone/moneyone.storage";

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
  consent?: ConsentData | null;
  /** Extra classes for the modal's own "Analyse" trigger pill. */
  triggerClassName?: string;
  /** Trigger text (defaults to "Analyse"). */
  triggerLabel?: string;
}

/**
 * Column configuration for holdings tables
 */
export interface ColumnConfig {
  key: string;
  label: string;
  align: "left" | "right" | "center";
}
