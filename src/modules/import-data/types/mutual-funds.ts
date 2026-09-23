/**
 * Mutual Fund-specific types and constants
 */

import { ConsentType } from "@/modules/import-data/types/consent-type";
import { BaseHolding, BaseAccountType } from "./common";

/**
 * Mutual Fund-specific holding type
 */
export interface MutualFundHolding extends BaseHolding {
  amc: string;
  nav: string;
  folioNo: string;
  navDate: string;
  amfiCode: string;
  schemeCode: string;
  schemeTypes: string;
  closingUnits: string;
  schemeOption: string;
  schemeCategory: string;
  isinDescription: string;
}

/**
 * Mutual Fund holding with quantity field for form management
 */
export type MutualFundHoldingWithQuantity = MutualFundHolding & {
  quantity: number;
};

/**
 * Mutual Fund FI data account type
 */
export type MutualFundsFiDataAccount = BaseAccountType<MutualFundHolding> & {
  fiType: "MUTUAL_FUNDS";
};

/**
 * Mutual Fund FI data response (array of accounts)
 */
export type MutualFundsFiDataResponse = MutualFundsFiDataAccount[];

/**
 * Mutual Fund form data structure
 */
export interface MutualFundsFormData {
  holdings: MutualFundHoldingWithQuantity[];
}

/**
 * Quantity field name for mutual funds
 */
export const MUTUAL_FUND_QUANTITY_FIELD = "closingUnits" as const;

/**
 * Consent type constant
 */
export const MUTUAL_FUNDS_CONSENT_TYPE = ConsentType.MUTUAL_FUNDS;
