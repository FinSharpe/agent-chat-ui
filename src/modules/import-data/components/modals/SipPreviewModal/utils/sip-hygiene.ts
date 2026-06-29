/**
 * SIP registry & account-hygiene computations.
 *
 * Derived purely from the `Profile` block, which the registrar shares today —
 * so these figures are real now, ahead of the gated performance analytics that
 * wait on `Summary`/`Transactions`.
 */

import { SIPFiDataResponse, SipHygiene } from "@/modules/import-data/types/sip";
import { extractFundHouseName } from "./sip-transformer";

/** Treat "Completed" (any case) as KYC-compliant; anything else is a gap. */
function isKycCompliant(status: string | undefined): boolean {
  return (status ?? "").trim().toLowerCase() === "completed";
}

/** A nominee counts as present only if a non-empty value is recorded. */
function hasNominee(nominee: string | undefined): boolean {
  return Boolean((nominee ?? "").trim());
}

/**
 * Compute registry/hygiene facts across all SIP accounts. Operates on the first
 * holder of each account (SIP folios are single-holder in practice).
 */
export function computeSipHygiene(
  accounts: SIPFiDataResponse | undefined | null,
): SipHygiene {
  const list = accounts ?? [];

  let kycCompliant = 0;
  let kycTotal = 0;
  let nomineeGap = 0;
  const fundHouses = new Set<string>();
  const registrars = new Set<string>();

  for (const account of list) {
    const holder = account.Profile?.Holders?.Holder?.[0];

    fundHouses.add(extractFundHouseName(account.maskedAccountNumber));
    if (account.bank) registrars.add(account.bank);

    // Only fold KYC/nominee into the totals when we actually have a holder
    // profile to read — a missing Profile shouldn't inflate the gap counts.
    if (holder) {
      kycTotal += 1;
      if (isKycCompliant(holder.kycCompliance)) kycCompliant += 1;
      if (!hasNominee(holder.nominee)) nomineeGap += 1;
    }
  }

  return {
    registrations: list.length,
    kycCompliant,
    kycTotal,
    nomineeGap,
    fundHouses: [...fundHouses],
    registrars: [...registrars],
  };
}
