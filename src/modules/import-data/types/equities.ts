/**
 * Equity-specific types and constants
 */

import { ConsentType } from "@/modules/import-data/types/consent-type";
import { BaseHolding, BaseAccountType } from "./common";

/**
 * Equity-specific holding type
 */
export interface EquityHolding extends BaseHolding {
  units: string;
  issuerName: string;
  isinDescription: string;
  lastTradedPrice: string;
}

/**
 * Equity holding with quantity field for form management
 */
export type EquityHoldingWithQuantity = EquityHolding & { quantity: number };

/**
 * Equity FI data account type
 */
export type EquitiesFiDataAccount = BaseAccountType<EquityHolding> & {
  fiType: "EQUITIES";
};

/**
 * Equity FI data response (array of accounts)
 */
export type EquitiesFiDataResponse = EquitiesFiDataAccount[];

/**
 * Equity form data structure
 */
export interface EquitiesFormData {
  holdings: EquityHoldingWithQuantity[];
}

/**
 * Equity markdown format for chat import
 */
export interface EquityMarkdownFormat {
  "Company Name": string;
  "ISIN": string;
  "Units": string;
}

/**
 * Quantity field name for equities
 */
export const EQUITY_QUANTITY_FIELD = "units" as const;

/**
 * Consent type constant
 */
export const EQUITIES_CONSENT_TYPE = ConsentType.EQUITIES;
