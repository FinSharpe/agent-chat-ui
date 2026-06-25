/**
 * SIP-specific data transformations
 */

import {
  SIPDisplayData,
  SIPMarkdownFormat,
  SIPFiDataResponse,
} from "@/modules/import-data/types/sip";

/**
 * Extract fund house name from masked account number
 * e.g. "TATA-XXX3111" -> "TATA", "HDFC-XXXX1760" -> "HDFC"
 */
export function extractFundHouseName(maskedAccountNumber: string): string {
  const parts = maskedAccountNumber.split("-");
  return parts.length > 1 ? parts[0] : maskedAccountNumber;
}

/**
 * Transform SIP accounts to display data for the preview table
 */
export function transformSipAccountsToDisplayData(
  accounts: SIPFiDataResponse | undefined | null,
): SIPDisplayData[] {
  if (!accounts) return [];

  return accounts.map((account) => {
    const holder = account.Profile?.Holders?.Holder?.[0];

    return {
      fundHouse: extractFundHouseName(account.maskedAccountNumber),
      maskedAccountNumber: account.maskedAccountNumber,
      registrar: account.bank || "-",
      holderName: holder?.name || "-",
    };
  });
}

/**
 * Transform SIP accounts to markdown format for chat import
 */
export function transformSipAccountsToMarkdownFormat(
  accounts: SIPFiDataResponse | undefined | null,
): SIPMarkdownFormat[] {
  if (!accounts) return [];

  return accounts.map((account) => {
    const holder = account.Profile?.Holders?.Holder?.[0];

    return {
      "Fund House": extractFundHouseName(account.maskedAccountNumber),
      "Account Number": account.maskedAccountNumber,
      Registrar: account.bank || "-",
      "Holder Name": holder?.name || "-",
    };
  });
}
