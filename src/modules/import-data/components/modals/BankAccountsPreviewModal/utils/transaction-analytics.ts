/**
 * Transaction Analytics Utilities
 * Functions for processing and aggregating transaction data for visualizations
 */

import { Transaction } from "@/modules/import-data/types/bank-accounts";
import {
  format,
  parseISO,
  startOfMonth,
  isWithinInterval,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from "date-fns";

/**
 * Balance data point for trend chart
 */
export interface BalanceDataPoint {
  date: string;
  balance: number;
  formattedDate: string;
}

/**
 * Monthly aggregated data for income/expense analysis
 */
export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  netFlow: number;
}

/**
 * Transaction with parsed data for display
 */
export interface ProcessedTransaction extends Transaction {
  parsedAmount: number;
  parsedBalance: number;
  formattedDate: string;
  formattedTime: string;
}

/**
 * Parse transaction timestamp to Date object
 */
function parseTransactionDate(timestamp: string): Date {
  try {
    return parseISO(timestamp);
  } catch {
    return new Date(timestamp);
  }
}

/**
 * Format currency for Indian Rupee
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format duration between two dates as a compact string (e.g., "6d", "6m", "1y")
 */
export function formatDuration(startDate: string, endDate: string): string {
  try {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    const years = differenceInYears(end, start);
    if (years >= 1) {
      return `${years}y`;
    }

    const months = differenceInMonths(end, start);
    if (months >= 1) {
      return `${months}m`;
    }

    const days = differenceInDays(end, start);
    return `${days}d`;
  } catch {
    return "";
  }
}

/**
 * Process transactions and prepare balance trend data
 * Returns data points sorted chronologically
 */
export function prepareBalanceTrendData(
  transactions: Transaction[],
): BalanceDataPoint[] {
  if (!transactions || transactions.length === 0) return [];

  // Sort transactions chronologically (oldest first)
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = parseTransactionDate(a.transactionTimestamp);
    const dateB = parseTransactionDate(b.transactionTimestamp);
    return dateA.getTime() - dateB.getTime();
  });

  // Map to balance data points
  const dataPoints = sortedTransactions.map((txn) => {
    const date = parseTransactionDate(txn.transactionTimestamp);
    const balance = parseFloat(txn.currentBalance) || 0;

    return {
      date: txn.transactionTimestamp,
      balance,
      formattedDate: format(date, "dd MMM yyyy"),
    };
  });

  return dataPoints;
}

/**
 * Aggregate transactions by month for income/expense analysis
 */
export function aggregateMonthlyData(
  transactions: Transaction[],
): MonthlyData[] {
  if (!transactions || transactions.length === 0) return [];

  // Group transactions by month
  const monthlyMap = new Map<string, { income: number; expenses: number }>();

  transactions.forEach((txn) => {
    const date = parseTransactionDate(txn.transactionTimestamp);
    const monthKey = format(startOfMonth(date), "MMM yyyy");
    const amount = parseFloat(txn.amount) || 0;

    const existing = monthlyMap.get(monthKey) || { income: 0, expenses: 0 };

    if (txn.type === "CREDIT") {
      existing.income += amount;
    } else if (txn.type === "DEBIT") {
      existing.expenses += amount;
    }

    monthlyMap.set(monthKey, existing);
  });

  // Convert to array and sort chronologically
  const monthlyData: MonthlyData[] = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      netFlow: data.income - data.expenses,
    }))
    .sort((a, b) => {
      // Parse month strings for chronological sorting
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });

  return monthlyData;
}

/**
 * Process transactions for display in list
 * Returns most recent transactions first
 */
export function processTransactionsForDisplay(
  transactions: Transaction[],
  limit: number = 20,
): ProcessedTransaction[] {
  if (!transactions || transactions.length === 0) return [];

  // Sort by date (most recent first)
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = parseTransactionDate(a.transactionTimestamp);
    const dateB = parseTransactionDate(b.transactionTimestamp);
    return dateB.getTime() - dateA.getTime();
  });

  // Take top N transactions and add formatted data
  return sortedTransactions.slice(0, limit).map((txn) => {
    const date = parseTransactionDate(txn.transactionTimestamp);

    return {
      ...txn,
      parsedAmount: parseFloat(txn.amount) || 0,
      parsedBalance: parseFloat(txn.currentBalance) || 0,
      formattedDate: format(date, "dd MMM yyyy"),
      formattedTime: format(date, "HH:mm"),
    };
  });
}

/**
 * Calculate transaction statistics
 */
export interface TransactionStats {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  transactionCount: number;
  averageBalance: number;
  highestBalance: number;
  lowestBalance: number;
}

export function calculateTransactionStats(
  transactions: Transaction[],
): TransactionStats {
  if (!transactions || transactions.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netFlow: 0,
      transactionCount: 0,
      averageBalance: 0,
      highestBalance: 0,
      lowestBalance: 0,
    };
  }

  let totalIncome = 0;
  let totalExpenses = 0;
  let totalBalance = 0;
  let highestBalance = -Infinity;
  let lowestBalance = Infinity;

  transactions.forEach((txn) => {
    const amount = parseFloat(txn.amount) || 0;
    const balance = parseFloat(txn.currentBalance) || 0;

    if (txn.type === "CREDIT") {
      totalIncome += amount;
    } else if (txn.type === "DEBIT") {
      totalExpenses += amount;
    }

    totalBalance += balance;
    highestBalance = Math.max(highestBalance, balance);
    lowestBalance = Math.min(lowestBalance, balance);
  });

  return {
    totalIncome,
    totalExpenses,
    netFlow: totalIncome - totalExpenses,
    transactionCount: transactions.length,
    averageBalance: totalBalance / transactions.length,
    highestBalance: highestBalance === -Infinity ? 0 : highestBalance,
    lowestBalance: lowestBalance === Infinity ? 0 : lowestBalance,
  };
}

/**
 * Filter transactions by date range
 */
export function filterTransactionsByDateRange(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date,
): Transaction[] {
  return transactions.filter((txn) => {
    const txnDate = parseTransactionDate(txn.transactionTimestamp);
    return isWithinInterval(txnDate, { start: startDate, end: endDate });
  });
}
