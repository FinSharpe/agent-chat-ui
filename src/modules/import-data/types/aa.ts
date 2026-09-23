/**
 * Account Aggregator contract — the backend's `/api/aa/*` endpoints, the same
 * transport finsharpe-mobile uses (`lib/features/portfolio/data/aa_api.dart`).
 *
 * Every shape here is transcribed from the live backend's OpenAPI schema
 * (`GET {LANGGRAPH_API_URL}/openapi.json`, components `ConsentRecord`,
 * `CreateConsentBody`, `FiDataApiResponse`, `Normalized*`, …). The server
 * normalizes MoneyOne's payloads — the client never parses raw FinPro JSON.
 */

export const CONSENT_TYPES = [
  "EQUITIES",
  "MUTUAL_FUNDS",
  "ETF",
  "BANK_ACCOUNTS",
  "SIP",
] as const;

export type AaConsentType = (typeof CONSENT_TYPES)[number];

export function isAaConsentType(value: unknown): value is AaConsentType {
  return (
    typeof value === "string" &&
    (CONSENT_TYPES as readonly string[]).includes(value)
  );
}

/** A completed consent row (the backend's shared `Consent` table). */
export interface ConsentRecord {
  consentID: string;
  type: AaConsentType;
  mobileNo: string;
  name?: string | null;
  /** ISO-ish creation timestamp, as MoneyOne reports it. */
  consentCreationData: string;
  consentExpiry: string;
  isDataReady: boolean;
}

/** A resumable consent found at the AA by mobile number (`/consents/discover`). */
export interface DiscoveredConsent {
  consentID?: string | null;
  consentHandle?: string | null;
  accountID?: string;
  /** "ACTIVE" | "PENDING" — kept as a string, the AA adds states over time. */
  status: string;
  consentCreationData?: string | null;
  consentExpiry?: string | null;
  accounts?: DiscoveredAccount[];
}

export interface DiscoveredAccount {
  fipName?: string | null;
  maskedAccountNumber?: string | null;
  fiType?: string | null;
  accountType?: string | null;
}

export interface CreateConsentResponse {
  consentHandle: string;
  webRedirectionUrl: string;
  accountID: string;
}

export type ResolveStatus =
  | "linked"
  | "pending"
  | "rejected"
  | "failed"
  | "not_found";

export interface ResolveConsentResponse {
  status: ResolveStatus;
  consent?: ConsentRecord | null;
  message?: string | null;
}

/** Params MoneyOne appends to the return URL, forwarded to `resolve` untouched. */
export interface ConsentReturnParams {
  ecres?: string | null;
  resdate?: string | null;
  fi?: string | null;
  consentHandle?: string | null;
  consentID?: string | null;
  mobileNo?: string | null;
  accountID?: string | null;
}

// ---------------------------------------------------------------------------
// Normalized FI data
// ---------------------------------------------------------------------------

export interface NormalizedHolding {
  isin: string;
  name: string;
  units: number;
  price?: number | null;
  value?: number | null;
  folioNo?: string | null;
  amc?: string | null;
  schemeCategory?: string | null;
  navDate?: string | null;
}

export interface NormalizedMfTransaction {
  isin: string;
  amount?: number | null;
  units?: number | null;
  nav?: number | null;
  navDate?: string | null;
  transactionDate?: string | null;
  type?: string | null;
  narration?: string | null;
  registrar?: string | null;
}

export interface ActiveSip {
  isin: string;
  schemeName?: string | null;
  installmentAmount: number;
  cadence: "weekly" | "fortnightly" | "monthly" | "quarterly" | "irregular";
  lastDebitDate?: string | null;
  nextDebitEstimate?: string | null;
  installmentsInWindow: number;
  source: "narration" | "recurrence";
}

export interface NormalizedInvestments {
  assetClass: "EQUITIES" | "MUTUAL_FUNDS" | "ETF";
  currentValue?: number | null;
  costValue?: number | null;
  costBasisValue?: number | null;
  accountCount: number;
  holdings: NormalizedHolding[];
  transactions?: NormalizedMfTransaction[];
  activeSips?: ActiveSip[];
  transactionsEnd?: string | null;
}

export interface NormalizedTransaction {
  type: "DEBIT" | "CREDIT";
  mode?: string | null;
  amount: number;
  balance?: number | null;
  timestamp?: string | null;
  valueDate?: string | null;
  narration?: string | null;
  reference?: string | null;
}

export interface NormalizedBankAccount {
  maskedAccountNumber?: string | null;
  bank?: string | null;
  accountType?: string | null;
  currentBalance?: number | null;
  branch?: string | null;
  ifscCode?: string | null;
  status?: string | null;
  balanceDateTime?: string | null;
  transactionsStart?: string | null;
  transactionsEnd?: string | null;
  transactions?: NormalizedTransaction[];
}

export interface NormalizedBank {
  assetClass: "BANK_ACCOUNTS";
  totalBalance?: number | null;
  accountCount: number;
  accounts: NormalizedBankAccount[];
}

export interface SipRegistration {
  fundHouse: string;
  maskedAccountNumber: string;
  registrar: string;
  holderName: string;
  kycCompliance?: string | null;
  nominee?: string | null;
}

export interface SipHygiene {
  registrations: number;
  kycCompliant: number;
  kycTotal: number;
  nomineeGap: number;
  fundHouses: string[];
  registrars: string[];
}

export interface SipScheme {
  fundHouse?: string | null;
  schemeName?: string | null;
  isin?: string | null;
  folioNumber?: string | null;
  invested?: number | null;
  currentValue?: number | null;
  returnsPct?: number | null;
  monthlySip?: number | null;
}

export interface SipAnalytics {
  schemes: SipScheme[];
  totalInvested?: number | null;
  totalCurrentValue?: number | null;
  absoluteReturn?: number | null;
  returnsPct?: number | null;
  monthlyCommitment?: number | null;
  installmentCount?: number | null;
  nextDebitDate?: string | null;
}

export interface NormalizedSip {
  assetClass: "SIP";
  registrations: SipRegistration[];
  hygiene: SipHygiene;
  analytics?: SipAnalytics | null;
}

export type NormalizedFi =
  | NormalizedInvestments
  | NormalizedBank
  | NormalizedSip;

/** `GET /api/aa/consents/{id}/fi-data` — one consent's normalized payload. */
export interface FiBlob {
  consentID: string;
  type: AaConsentType;
  /** ISO timestamp of the server-side fetch — the "Last synced" source. */
  fetchedAt: string;
  normalized: NormalizedFi;
}

export const isInvestments = (n: NormalizedFi): n is NormalizedInvestments =>
  n.assetClass === "EQUITIES" ||
  n.assetClass === "MUTUAL_FUNDS" ||
  n.assetClass === "ETF";

export const isBank = (n: NormalizedFi): n is NormalizedBank =>
  n.assetClass === "BANK_ACCOUNTS";

export const isSip = (n: NormalizedFi): n is NormalizedSip =>
  n.assetClass === "SIP";
