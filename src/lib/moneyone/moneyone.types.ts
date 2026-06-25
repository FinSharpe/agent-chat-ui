import type { BaseHolding } from "@/modules/import-data/types/common";
import type { EquityHolding } from "@/modules/import-data/types/equities";
import type { ETFHolding } from "@/modules/import-data/types/etf";
import type { MutualFundHolding } from "@/modules/import-data/types/mutual-funds";
import { Dispatch, SetStateAction } from "react";
import { z } from "zod";
import { ConsentType } from "./moneyone.enums";

export interface Consent {
  consentID: string;
  consentHandle: string;
  status: string;
  productID: string;
  accountID: string;
  aaId: string;
  vua: string;
  consentCreationData: string;
}

export type ImportHoldingsContextType = {
  showCreateConsentModal: boolean;
  setShowCreateConsentModal: Dispatch<SetStateAction<boolean>>;
  consentType: ConsentType;
};

export const createNewConsentFormSchema = z.object({
  number: z
    .string()
    .min(10)
    .max(10)
    .trim()
    .transform((val) => val.replaceAll(" ", "")),
  pan: z
    .string()
    .min(10)
    .max(10)
    .trim()
    .transform((val) => val.replaceAll(" ", "")),
});

export type CreateNewConsentFormValues = z.infer<
  typeof createNewConsentFormSchema
>;

export type ConsentRequestV3Response = {
  status: string;
  ver: string;
  message: string;
  data: {
    webRedirectionUrl: string;
    status: string;
    consent_handle: string;
  };
};

// --- Reference contract for the (removed) MoneyOne data-ready webhook. ---
// Retained to document the payload for recreating the webhook; see
// docs/reference/IMPORT_HOLDINGS_DOCUMENTATION.md Appendix A. Not used at runtime.
export type LinkRefNumber = {
  linkRefNumber: string;
  fiStatus: string;
  fipName: string;
  fipId: string;
  maskedAccountNumber: string;
};

export type DataReadyWebHookReqBody = {
  timestamp: string;
  consentHandle: string;
  eventType: string;
  eventStatus: string;
  consentId: string;
  vua: string;
  eventMessage: string;
  productID: string;
  accountID: string;
  fetchType: string;
  consentExpiry: string;
  dataExpiry: string;
  sessionId: string;
  firstTimeFetch: boolean;
  linkRefNumbers: LinkRefNumber[];
};

// Holding types — canonical definitions in @/modules/import-data/types/
export type { BaseHolding, EquityHolding, ETFHolding, MutualFundHolding };

// Generic Holding type based on ConsentType
export type Holding<T extends ConsentType = ConsentType> =
  T extends ConsentType.EQUITIES ? EquityHolding :
  T extends ConsentType.MUTUAL_FUNDS ? MutualFundHolding :
  T extends ConsentType.ETF ? ETFHolding :
  EquityHolding | MutualFundHolding | ETFHolding; // Fallback for generic usage

// Legacy type for backwards compatibility (union of all holding types)
export type AnyHolding = EquityHolding | MutualFundHolding | ETFHolding;

export type NumericKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

type FiDataAccountSummary = {
  costValue: string;
  currentValue: string;
  Investment: {
    Holdings: {
      Holding: AnyHolding[];
    };
  };
};

type AccountType = {
  linkReferenceNumber: string;
  maskedAccountNumber: string;
  fiType: string;
  bank: string;
  Summary?: FiDataAccountSummary;
  Profile?: {
    Holders: {
      type: string;
      Holder: Array<{
        dob: string;
        pan: string;
        name: string;
        email: string;
        mobile: string;
        address: string;
        nominee: string;
        landline: string;
        kycCompliance: string;
      }>;
    };
  };
};

export type FiDataResponse = AccountType[];

export type FiRequestResponse = {
  ver: string;
  timestamp: string;
  response: string;
  data: {
    consentId: string;
    sessionId: string;
  };
};
