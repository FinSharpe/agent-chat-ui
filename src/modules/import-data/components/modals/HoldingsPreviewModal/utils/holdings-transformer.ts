import { ConsentType } from "@/modules/import-data/types/consent-type";
import {
  FiDataResponse,
  AnyHolding,
  EquityHolding,
  MutualFundHolding,
  ETFHolding,
} from "@/modules/import-data/types/moneyone-raw";
import {
  MutualFundSearchResponse,
  StockSearchResponse,
} from "@/types/search-api.types";
import { QUANTITY_FIELD_MAP } from "./holdings-constants";

/**
 * Type for holding with quantity field for form management
 */
export type HoldingWithQuantity = AnyHolding & { quantity: number };

/**
 * Extract all holdings from FI data response
 */
export function extractHoldingsFromFiData(
  fiData: FiDataResponse | undefined | null,
): AnyHolding[] {
  if (!fiData) return [];

  const allHoldings: AnyHolding[] = [];

  fiData.forEach((account) => {
    if (account.Summary?.Investment?.Holdings?.Holding) {
      allHoldings.push(...account.Summary.Investment.Holdings.Holding);
    }
  });

  return allHoldings;
}

/**
 * Sum the current value across all accounts (shown in the ETF summary card).
 * Returns null when no account reports a value.
 */
export function extractCurrentValueFromFiData(
  fiData: FiDataResponse | undefined | null,
): string | null {
  if (!fiData) return null;

  let totalValue = 0;
  let hasValue = false;

  fiData.forEach((account) => {
    if (account.Summary?.currentValue) {
      const value = parseFloat(account.Summary.currentValue);
      if (!isNaN(value)) {
        totalValue += value;
        hasValue = true;
      }
    }
  });

  return hasValue ? totalValue.toString() : null;
}

/**
 * Transform holdings to form data with quantity field
 */
export function transformHoldingsToFormData(
  holdings: AnyHolding[],
  consentType: ConsentType,
): HoldingWithQuantity[] {
  const quantityField = QUANTITY_FIELD_MAP[consentType];

  return holdings.map((holding) => ({
    ...holding,
    quantity: parseFloat((holding as any)[quantityField] || "0"),
  }));
}

/**
 * Transform form data back to holdings (for submission)
 * Filters out holdings with quantity = 0
 */
export function transformFormDataToHoldings(
  formHoldings: HoldingWithQuantity[],
  consentType: ConsentType,
): AnyHolding[] {
  const quantityField = QUANTITY_FIELD_MAP[consentType];

  // Filter out holdings with quantity = 0
  const validHoldings = formHoldings.filter((h) => h.quantity > 0);

  return validHoldings.map((holding) => {
    const { quantity, ...holdingWithoutQuantity } = holding;

    return {
      ...holdingWithoutQuantity,
      [quantityField]: quantity.toString(),
    } as AnyHolding;
  });
}

/**
 * Transform search result (equity, mutual fund, or ETF) to holding with quantity
 */
export function transformSearchResultToHolding(
  result:
    | StockSearchResponse["results"][0]
    | MutualFundSearchResponse["results"][0],
  consentType: ConsentType,
): HoldingWithQuantity {
  if (consentType === ConsentType.EQUITIES && "symbol" in result) {
    // Add equity
    return {
      issuerName: result.compname,
      isin: result.symbol,
      isinDescription: result.compname,
      units: "0",
      lastTradedPrice: "0",
      quantity: 0,
      ucc: "",
      lienUnits: "0",
      registrar: "",
      FatcaStatus: "",
      lockinUnits: "0",
    } as EquityHolding & { quantity: number };
  } else if (
    consentType === ConsentType.MUTUAL_FUNDS &&
    "schemeCode" in result
  ) {
    // Add mutual fund
    return {
      schemeTypes: result.sName,
      amc: result.legalNames,
      folioNo: "",
      closingUnits: "0",
      nav: "0",
      navDate: "",
      quantity: 0,
      isinDescription: result.sName,
      isin: "",
      ucc: "",
      lienUnits: "0",
      registrar: "",
      FatcaStatus: "",
      lockinUnits: "0",
      amfiCode: "",
      schemeCode: result.schemeCode,
      schemeOption: "",
      schemeCategory: "",
    } as MutualFundHolding & { quantity: number };
  } else if (consentType === ConsentType.ETF && "symbol" in result) {
    // Add ETF (uses same search as equities)
    return {
      isinDescription: result.compname,
      isin: result.symbol,
      units: "0",
      nav: "0",
      folioNo: "",
      lastNavDate: "",
      quantity: 0,
      ucc: "",
      lienUnits: "0",
      registrar: "",
      FatcaStatus: "",
      lockinUnits: "0",
    } as ETFHolding & { quantity: number };
  }

  throw new Error("Invalid search result type");
}
