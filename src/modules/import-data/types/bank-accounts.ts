/**
 * Bank Account-specific types and constants
 */

import { ConsentType } from "@/modules/import-data/types/consent-type";

/**
 * Holder information
 */
export interface Holder {
  name: string;
  dob: string;
  mobile: string;
  ckycCompliance: string;
  nominee: string;
  landline: string;
  address: string;
  email: string;
  pan: string;
}

/**
 * Account profile
 */
export interface Profile {
  Holders: {
    type: string;
    Holder: Holder[];
  };
}

/**
 * Transaction details
 */
export interface Transaction {
  type: "DEBIT" | "CREDIT";
  mode: string;
  amount: string;
  currentBalance: string;
  transactionTimestamp: string;
  valueDate: string;
  txnId: string;
  narration: string;
  reference: string;
}

/**
 * Bank account summary (different from investment holdings)
 */
export interface BankAccountSummary {
  exchgeRate: string;
  currentBalance: string;
  currency: string;
  balanceDateTime: string;
  type: "SAVINGS" | "CURRENT" | "SALARY" | "OTHER";
  branch: string;
  facility: string;
  ifscCode: string;
  micrCode: string;
  openingDate: string;
  currentODLimit: string;
  drawingLimit: string;
  status: "ACTIVE" | "INACTIVE" | "CLOSED";
  Pending: unknown[];
}

/**
 * Transactions container
 */
export interface Transactions {
  startDate: string;
  endDate: string;
  Transaction: Transaction[];
}

/**
 * Bank account data (single account)
 */
export interface BankAccount {
  linkReferenceNumber: string;
  maskedAccountNumber: string;
  fiType: "DEPOSIT";
  bank: string;
  Profile: Profile;
  Summary: BankAccountSummary;
  Transactions: Transactions;
}

/**
 * Bank account with form-ready data for display
 */
export interface BankAccountWithFormData extends BankAccount {
  displayBalance: string;
  displayBank: string;
  displayAccountType: string;
  displayAccountNumber: string;
  quantity: number; // For consistency with other holdings (always 1 for bank accounts)
}

/**
 * Bank accounts FI data response (array of accounts)
 */
export type BankAccountsFiDataResponse = BankAccount[];

/**
 * Bank account form data structure
 */
export interface BankAccountsFormData {
  accounts: BankAccountWithFormData[];
}

/**
 * Note: AccountInsights interface is now defined in
 * src/modules/import-data/components/modals/BankAccountsPreviewModal/utils/bank-accounts-transformer.ts
 * It excludes sensitive information (bank name, account number, IFSC) for chat analysis
 */

/**
 * Consent type constant
 */
export const BANK_ACCOUNTS_CONSENT_TYPE = ConsentType.BANK_ACCOUNTS;
