/**
 * MoneyOne's raw per-account FI payloads.
 *
 * Since T-11 nothing in this app calls MoneyOne: these shapes arrive from OUR
 * backend, which returns them alongside its normalized block when the client
 * asks for `?includeRaw=true` (`GET /api/aa/consents/{id}/fi-data`). The
 * analysis modals parse them for the column-level detail the normalized shapes
 * don't carry — UCC, registrar, FATCA status, MICR code, holder profile.
 *
 * Everything the account rows and the net-worth card show comes from
 * `normalized` instead (see `types/aa.ts` and `utils/aa-fold.ts`); prefer that
 * for anything new.
 */
import type { BaseHolding } from "./common";
import type { EquityHolding } from "./equities";
import type { ETFHolding } from "./etf";
import type { MutualFundHolding } from "./mutual-funds";

// Holding types — canonical definitions in ./equities, ./etf, ./mutual-funds.
export type { BaseHolding, EquityHolding, ETFHolding, MutualFundHolding };

/** Any investment holding, whichever asset class it came from. */
export type AnyHolding = EquityHolding | MutualFundHolding | ETFHolding;

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

/** One consent's raw FI data: an array of per-account payloads. */
export type FiDataResponse = AccountType[];
