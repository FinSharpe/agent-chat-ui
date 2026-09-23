/**
 * Cross-account figures for the bank view, mirroring finsharpe-mobile's
 * `cash_screen.dart`: the combined balance over the shared statement period,
 * the latest month's money in and out, and every account's transactions in
 * one timeline. Everything comes from the accounts' own transactions.
 */
import { format, parseISO } from "date-fns";
import type {
  BankAccount,
  Transaction,
} from "@/modules/import-data/types/bank-accounts";
import type { BalanceDataPoint } from "./transaction-analytics";

const txnsOf = (a: BankAccount): Transaction[] =>
  a.Transactions?.Transaction ?? [];

const timeOf = (t: Transaction) => {
  const ms = Date.parse(t.transactionTimestamp ?? "");
  return Number.isFinite(ms) ? ms : null;
};

/** Every account's transactions, oldest first. */
export function allTransactions(accounts: BankAccount[]): Transaction[] {
  return accounts
    .flatMap(txnsOf)
    .filter((t) => timeOf(t) !== null)
    .sort((a, b) => timeOf(a)! - timeOf(b)!);
}

/**
 * The combined balance of the accounts that shared transactions, after each
 * transaction — starting only once every one of them has a known balance, so
 * the line never sums a partial set of accounts.
 */
export function combinedBalanceTrend(accounts: BankAccount[]): {
  points: BalanceDataPoint[];
  accounts: number;
} {
  const withTxns = accounts.filter((a) => txnsOf(a).length > 0);
  const events = withTxns
    .flatMap((a, idx) => txnsOf(a).map((t) => ({ idx, t, ms: timeOf(t) })))
    .filter(
      (e): e is { idx: number; t: Transaction; ms: number } => e.ms !== null,
    )
    .sort((a, b) => a.ms - b.ms);

  const last = new Map<number, number>();
  const points: BalanceDataPoint[] = [];
  for (const { idx, t, ms } of events) {
    const bal = parseFloat(t.currentBalance);
    if (!Number.isFinite(bal)) continue;
    last.set(idx, bal);
    if (last.size < withTxns.length) continue;
    let sum = 0;
    last.forEach((v) => (sum += v));
    points.push({
      date: t.transactionTimestamp,
      balance: sum,
      formattedDate: format(new Date(ms), "dd MMM yyyy"),
    });
  }
  return { points, accounts: withTxns.length };
}

/**
 * Money in and out over the latest calendar month the statements reach. The
 * month is named, never assumed to be the current one: a statement that ends
 * last month has no figures for this one, and ₹0 would be a false statement.
 */
export function latestMonthFlow(txns: Transaction[]) {
  const last = txns[txns.length - 1];
  if (!last) return null;
  const key = last.transactionTimestamp.slice(0, 7);
  let moneyIn = 0;
  let moneyOut = 0;
  for (const t of txns) {
    if (t.transactionTimestamp.slice(0, 7) !== key) continue;
    const amount = parseFloat(t.amount) || 0;
    if (t.type === "CREDIT") moneyIn += amount;
    else if (t.type === "DEBIT") moneyOut += amount;
  }
  let label = key;
  try {
    label = format(parseISO(`${key}-01`), "MMM yyyy");
  } catch {
    /* keep the raw key */
  }
  return { moneyIn, moneyOut, label };
}
