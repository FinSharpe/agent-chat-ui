/**
 * Per-account cash-flow helpers for the bank view's accounts list and chart
 * labels, derived from the accounts' own transactions and balances.
 */
import { format } from "date-fns";
import type {
  BankAccount,
  Transaction,
} from "@/modules/import-data/types/bank-accounts";
import { calculateTransactionStats } from "./transaction-analytics";

export type CashFlow = {
  income: number;
  expenses: number;
  /** Distinct calendar months the transactions span (≥ 1). */
  months: number;
  avgIncome: number;
  avgExpenses: number;
  avgNet: number;
  /** Net as a share of income, or null without income. */
  savingsRate: number | null;
};

const txnsOf = (a: BankAccount): Transaction[] =>
  a.Transactions?.Transaction ?? [];

export const hasTransactions = (a: BankAccount) => txnsOf(a).length > 0;

function monthsSpanned(txns: Transaction[]): number {
  const months = new Set(
    txns.map((t) => (t.transactionTimestamp ?? t.valueDate ?? "").slice(0, 7)),
  );
  months.delete("");
  return Math.max(1, months.size);
}

/** Income / expense totals and monthly averages for a set of transactions. */
export function cashFlowOf(txns: Transaction[]): CashFlow {
  const stats = calculateTransactionStats(txns);
  const months = monthsSpanned(txns);
  const avgIncome = stats.totalIncome / months;
  const avgExpenses = stats.totalExpenses / months;
  return {
    income: stats.totalIncome,
    expenses: stats.totalExpenses,
    months,
    avgIncome,
    avgExpenses,
    avgNet: avgIncome - avgExpenses,
    savingsRate:
      stats.totalIncome > 0
        ? ((stats.totalIncome - stats.totalExpenses) / stats.totalIncome) * 100
        : null,
  };
}

export const balanceOf = (a: BankAccount) =>
  parseFloat(a.Summary?.currentBalance ?? "") || 0;

/** "Mar – Aug 2026" style label for an account's statement window. */
export function periodLabel(start?: string, end?: string): string {
  if (!start || !end) return "";
  try {
    const s = new Date(start);
    const e = new Date(end);
    const sameYear = s.getFullYear() === e.getFullYear();
    return `${format(s, sameYear ? "MMM" : "MMM yyyy")} – ${format(e, "MMM yyyy")}`;
  } catch {
    return "";
  }
}
