/**
 * SIP-specific types and constants
 */

import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { ColumnConfig } from "./common";

/**
 * SIP holder profile information
 */
export interface SIPHolder {
  dob: string;
  pan: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  nominee: string;
  landline: string;
  kycCompliance: string;
}

/**
 * SIP account profile structure
 */
export interface SIPProfile {
  Holders: {
    type: string;
    Holder: SIPHolder[];
  };
}

/**
 * SIP Summary block — PROVISIONAL.
 *
 * The SIP fiType currently returns `Profile` only; `Summary`/`Transactions` are
 * not yet shared by the registrar (CAMS RTA). This models the mandate-level
 * summary we expect once they are, and is intentionally permissive so the
 * analytics layer degrades to em-dashes rather than throwing if field names
 * differ from what OneMoney ultimately confirms. See the helpdesk thread.
 */
export interface SIPSummary {
  /** Current valuation of the holdings backing this SIP mandate. */
  currentValue?: string;
  /** Total amount invested via this SIP to date, if the FIP provides it. */
  investedValue?: string;
  /** Recurring installment amount. */
  installmentAmount?: string;
  /** e.g. MONTHLY / WEEKLY. */
  frequency?: string;
  /** Next scheduled debit date (ISO). */
  nextInstallmentDate?: string;
  /** Scheme / fund identifiers, where available. */
  schemeName?: string;
  isin?: string;
  folioNumber?: string;
}

/**
 * A single SIP installment transaction — PROVISIONAL (see {@link SIPSummary}).
 */
export interface SIPTransaction {
  /** Debited amount for this installment. */
  amount?: string;
  /** PURCHASE / installment type. */
  type?: string;
  /** ISO datetime of the installment. */
  transactionDateTime?: string;
  /** NAV at which units were allotted. */
  navValue?: string;
  /** Units allotted for this installment. */
  units?: string;
  narration?: string;
}

/**
 * SIP FI data account type. `Profile` is available today; `Summary` and
 * `Transactions` are gated/provisional (see {@link SIPSummary}).
 */
export interface SIPAccount {
  linkReferenceNumber: string;
  maskedAccountNumber: string;
  fiType: "SIP";
  bank: string;
  Profile?: SIPProfile;
  Summary?: SIPSummary;
  Transactions?: { Transaction?: SIPTransaction[] };
}

/**
 * SIP FI data response (array of accounts)
 */
export type SIPFiDataResponse = SIPAccount[];

/**
 * SIP display data for the preview table
 */
export interface SIPDisplayData {
  fundHouse: string;
  maskedAccountNumber: string;
  registrar: string;
  holderName: string;
}

/**
 * SIP markdown format for chat import
 */
export interface SIPMarkdownFormat {
  "Fund House": string;
  "Account Number": string;
  Registrar: string;
  "Holder Name": string;
}

/**
 * Column configurations for SIP accounts table (read-only, no action column)
 */
export const SIP_COLUMNS: readonly ColumnConfig[] = [
  { key: "fundHouse", label: "Fund House", align: "left" },
  { key: "maskedAccountNumber", label: "Account Number", align: "left" },
  { key: "registrar", label: "Registrar", align: "left" },
  { key: "holderName", label: "Holder Name", align: "left" },
] as const;

/**
 * Registry & account-hygiene facts derived purely from the SIP `Profile` block
 * (available today). Not investment analytics — account-level housekeeping the
 * user can act on (KYC, nominee coverage, registrar/fund-house spread).
 */
export interface SipHygiene {
  /** Number of registered SIP folios. */
  registrations: number;
  /** Holders whose KYC is marked completed. */
  kycCompliant: number;
  /** Total holders considered (denominator for KYC). */
  kycTotal: number;
  /** Folios with no nominee registered — an actionable gap. */
  nomineeGap: number;
  /** Distinct fund houses (derived from the masked account prefix). */
  fundHouses: string[];
  /** Distinct registrars/RTAs. */
  registrars: string[];
}

/**
 * Per-scheme performance row — populated from {@link SIPSummary} +
 * {@link SIPTransaction}. Any field may be null when the registrar hasn't
 * shared the underlying datum.
 */
export interface SipSchemeAnalytics {
  fundHouse: string;
  maskedAccountNumber: string;
  monthlySip: number | null;
  invested: number | null;
  currentValue: number | null;
  returnsPct: number | null;
}

/**
 * Portfolio-level SIP performance analytics. Produced only when at least one
 * account carries a `Summary` or `Transactions` block; `null` otherwise (the
 * gate that keeps the locked placeholder showing until real data arrives).
 */
export interface SipAnalytics {
  totalInvested: number | null;
  totalCurrentValue: number | null;
  absoluteReturn: number | null;
  returnsPct: number | null;
  monthlyCommitment: number | null;
  installmentCount: number | null;
  nextDebitDate: string | null;
  perScheme: SipSchemeAnalytics[];
}

/**
 * Consent type constant
 */
export const SIP_CONSENT_TYPE = ConsentType.SIP;
