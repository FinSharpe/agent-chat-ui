/**
 * Portfolio-level cash-flow insights across the linked bank accounts, feeding
 * the reference "Bank Account Analysis" tiles and observations: savings rate,
 * emergency cover, spend by payment mode and plain-language flags. Everything
 * is derived from the accounts' own transactions and balances.
 */
import { format } from "date-fns";
import type {
  BankAccount,
  Transaction,
} from "@/modules/import-data/types/bank-accounts";
import { formatINRShort } from "@/modules/import-data/components/shared/ui";
import { extractBankBalanceFromFiData } from "./bank-accounts-transformer";
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

/** Debits grouped by payment mode (UPI, CARD, ATM…) — the spend breakdown. */
export function spendByMode(txns: Transaction[]) {
  const map = new Map<string, number>();
  for (const t of txns) {
    if (t.type !== "DEBIT") continue;
    const mode = (t.mode || "Other").toUpperCase();
    map.set(mode, (map.get(mode) ?? 0) + (parseFloat(t.amount) || 0));
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

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

export type BankSummary = {
  totalBalance: number;
  flow: CashFlow | null;
  /** Months of average expenses the total balance covers. */
  emergencyMonths: number | null;
  flags: { text: string; warn: boolean }[];
};

/** Everything the modal's tiles and observations need, across accounts. */
export function summariseAccounts(accounts: BankAccount[]): BankSummary {
  // Same total the My-Networth card shows, so the two can never drift.
  const totalBalance = extractBankBalanceFromFiData(accounts) ?? 0;
  const withTxns = accounts.filter(hasTransactions);
  const all = withTxns.flatMap(txnsOf);
  const flow = all.length > 0 ? cashFlowOf(all) : null;
  const emergencyMonths =
    flow && flow.avgExpenses > 0 ? totalBalance / flow.avgExpenses : null;

  const flags: BankSummary["flags"] = [];
  if (flow?.savingsRate != null) {
    const r = flow.savingsRate;
    flags.push(
      r < 0
        ? {
            warn: true,
            text: `Spending exceeded income by ${formatINRShort(-flow.avgNet)} a month over this period`,
          }
        : r >= 30
          ? {
              warn: false,
              text: `Savings rate at ${r.toFixed(1)}% — above the recommended 30%`,
            }
          : {
              warn: true,
              text: `Savings rate at ${r.toFixed(1)}% — below the recommended 30%`,
            },
    );
  }
  if (emergencyMonths !== null) {
    flags.push(
      emergencyMonths < 6
        ? {
            warn: true,
            text: `Balances cover ${emergencyMonths.toFixed(1)} months of expenses — target is 6 months`,
          }
        : {
            warn: false,
            text: `Balances cover ${emergencyMonths.toFixed(1)} months of expenses — a healthy emergency cushion`,
          },
    );
  }
  const modes = spendByMode(all);
  const spend = modes.reduce((s, m) => s + m.value, 0);
  const cash = modes.find((m) => m.name === "ATM" || m.name === "CASH");
  if (cash && spend > 0 && cash.value / spend > 0.2) {
    flags.push({
      warn: true,
      text: `${((cash.value / spend) * 100).toFixed(0)}% of spending is cash withdrawals — harder to track`,
    });
  }
  const silent = accounts.length - withTxns.length;
  if (silent > 0) {
    flags.push({
      warn: true,
      text: `${silent} account${silent === 1 ? "" : "s"} shared no transactions — balance only`,
    });
  }
  const negative = accounts.filter((a) => balanceOf(a) < 0).length;
  flags.push(
    negative > 0
      ? {
          warn: true,
          text: `${negative} account${negative === 1 ? " is" : "s are"} overdrawn`,
        }
      : {
          warn: false,
          text: "No overdraft or negative balance across any account",
        },
  );

  return { totalBalance, flow, emergencyMonths, flags };
}
