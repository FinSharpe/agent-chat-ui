/**
 * SIP performance analytics — the GATED layer.
 *
 * Builds a normalized {@link SipAnalytics} model from the `Summary` and
 * `Transactions` blocks. Returns `null` when NO account carries either block,
 * which is what keeps the locked "unlocks automatically" placeholder showing
 * today. Field reads are defensive (see provisional schema note on
 * `SIPSummary`): a missing datum collapses to `null`/em-dash rather than
 * throwing, so the dashboard renders gracefully even if the registrar's exact
 * field names differ from what we modelled.
 */

import {
  SIPFiDataResponse,
  SipAnalytics,
  SipSchemeAnalytics,
} from "@/modules/import-data/types/sip";
import { extractFundHouseName } from "./sip-transformer";

/** Parse a possibly-stringified number; null when absent or non-finite. */
function num(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : null;
}

/** Sum numeric values, ignoring nulls; null when nothing summable was present. */
function sumOrNull(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null);
  return present.length ? present.reduce((a, b) => a + b, 0) : null;
}

/** True when this account has any performance data to analyze. */
function hasPerfBlock(account: SIPFiDataResponse[number]): boolean {
  const txns = account.Transactions?.Transaction ?? [];
  return Boolean(account.Summary) || txns.length > 0;
}

function buildSchemeRow(
  account: SIPFiDataResponse[number],
): SipSchemeAnalytics {
  const txns = account.Transactions?.Transaction ?? [];

  const invested =
    num(account.Summary?.investedValue) ??
    sumOrNull(txns.map((t) => num(t.amount)));
  const currentValue = num(account.Summary?.currentValue);
  const returnsPct =
    invested && invested > 0 && currentValue !== null
      ? ((currentValue - invested) / invested) * 100
      : null;

  return {
    fundHouse: extractFundHouseName(account.maskedAccountNumber),
    maskedAccountNumber: account.maskedAccountNumber,
    monthlySip: num(account.Summary?.installmentAmount),
    invested,
    currentValue,
    returnsPct,
  };
}

/**
 * Compute portfolio-level SIP analytics, or `null` when no account has a
 * `Summary`/`Transactions` block yet.
 */
export function computeSipAnalytics(
  accounts: SIPFiDataResponse | undefined | null,
): SipAnalytics | null {
  const list = accounts ?? [];
  if (!list.some(hasPerfBlock)) return null;

  const perScheme = list.map(buildSchemeRow);

  const totalInvested = sumOrNull(perScheme.map((s) => s.invested));
  const totalCurrentValue = sumOrNull(perScheme.map((s) => s.currentValue));
  const absoluteReturn =
    totalInvested !== null && totalCurrentValue !== null
      ? totalCurrentValue - totalInvested
      : null;
  const returnsPct =
    totalInvested && totalInvested > 0 && totalCurrentValue !== null
      ? ((totalCurrentValue - totalInvested) / totalInvested) * 100
      : null;

  const installmentCount = list.reduce(
    (acc, a) => acc + (a.Transactions?.Transaction?.length ?? 0),
    0,
  );

  // Earliest upcoming installment date across accounts, if shared.
  const nextDebitDate =
    list
      .map((a) => a.Summary?.nextInstallmentDate)
      .filter((d): d is string => Boolean(d))
      .sort()[0] ?? null;

  return {
    totalInvested,
    totalCurrentValue,
    absoluteReturn,
    returnsPct,
    monthlyCommitment: sumOrNull(perScheme.map((s) => s.monthlySip)),
    installmentCount: installmentCount || null,
    nextDebitDate,
    perScheme,
  };
}
