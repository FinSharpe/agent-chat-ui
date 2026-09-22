/**
 * ETF-specific types and constants
 */

import { ConsentType } from "@/modules/import-data/types/consent-type";
import { BaseHolding, BaseAccountType } from "./common";

/**
 * ETF-specific holding type
 */
export interface ETFHolding extends BaseHolding {
  nav: string;
  units: string;
  folioNo: string;
  lastNavDate: string;
  isinDescription: string;
}

/**
 * ETF holding with quantity field for form management
 */
export type ETFHoldingWithQuantity = ETFHolding & { quantity: number };

/**
 * ETF FI data account type
 */
export type ETFFiDataAccount = BaseAccountType<ETFHolding> & {
  fiType: "ETF";
};

/**
 * ETF FI data response (array of accounts)
 */
export type ETFFiDataResponse = ETFFiDataAccount[];

/**
 * ETF form data structure
 */
export interface ETFFormData {
  holdings: ETFHoldingWithQuantity[];
}

/**
 * ETF markdown format for chat import
 */
export interface ETFMarkdownFormat {
  "ETF Name": string;
  "ISIN": string;
  "Units": string;
  "NAV": string;
}

/**
 * Quantity field name for ETFs
 */
export const ETF_QUANTITY_FIELD = "units" as const;

/**
 * Consent type constant
 */
export const ETF_CONSENT_TYPE = ConsentType.ETF;
