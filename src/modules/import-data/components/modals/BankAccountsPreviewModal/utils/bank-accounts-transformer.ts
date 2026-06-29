/**
 * Bank account-specific data transformations
 */

import {
  BankAccount,
  BankAccountWithFormData,
  BankAccountsFiDataResponse,
} from "@/modules/import-data/types/bank-accounts";

/**
 * Extract all bank accounts from FI data response
 */
export function extractBankAccountsFromFiData(
  fiData: BankAccountsFiDataResponse | undefined | null,
): BankAccount[] {
  if (!fiData) return [];
  return fiData;
}

/**
 * Sum the current balance across all bank accounts — the single source of truth
 * for a bank consent's total. Balances are summed signed (an overdraft/CURRENT
 * account's negative balance reduces the total), matching the preview form's
 * total exactly so the My-Networth figure and the modal can never drift.
 * Returns null when no account reports a balance (distinguishes "no data" from
 * a genuine ₹0).
 */
export function extractBankBalanceFromFiData(
  fiData: BankAccountsFiDataResponse | undefined | null,
): number | null {
  if (!fiData || fiData.length === 0) return null;

  let total = 0;
  let hasValue = false;

  fiData.forEach((account) => {
    const raw = account.Summary?.currentBalance;
    if (raw == null || raw === "") return;
    const value = parseFloat(raw);
    if (!isNaN(value)) {
      total += value;
      hasValue = true;
    }
  });

  return hasValue ? total : null;
}

/**
 * Format currency for display
 */
function formatCurrency(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Transform bank accounts to form data with display fields
 */
export function transformBankAccountsToFormData(
  accounts: BankAccount[],
): BankAccountWithFormData[] {
  return accounts.map((account) => ({
    ...account,
    displayBalance: formatCurrency(account.Summary.currentBalance),
    displayBank: account.bank,
    displayAccountType: account.Summary.type,
    displayAccountNumber: account.maskedAccountNumber,
    quantity: 1, // Always 1 for bank accounts (for consistency with other holdings)
  }));
}

/**
 * Transform form data back to bank accounts (for submission)
 * Filters out accounts with quantity = 0
 */
export function transformFormDataToBankAccounts(
  formAccounts: BankAccountWithFormData[],
): BankAccount[] {
  // Filter out accounts with quantity = 0
  const validAccounts = formAccounts.filter((acc) => acc.quantity > 0);

  return validAccounts.map((account) => {
    const {
      displayBalance: _displayBalance,
      displayBank: _displayBank,
      displayAccountType: _displayAccountType,
      displayAccountNumber: _displayAccountNumber,
      quantity: _quantity,
      ...accountWithoutDisplayFields
    } = account;

    return accountWithoutDisplayFields as BankAccount;
  });
}

/**
 * Calculate transaction insights from transaction history
 */
function calculateTransactionInsights(account: BankAccount): {
  totalTransactions: number;
  totalDebits: number;
  totalCredits: number;
  avgMonthlySpending: string;
  avgMonthlyIncome: string;
  avgMonthlyBalance: string;
  balanceTrend: "Positive" | "Negative" | "Stable";
  lastTransactionDate: string;
  transactionPeriod: string;
} {
  const transactions = account.Transactions?.Transaction || [];
  const currentBalance = parseFloat(account.Summary.currentBalance);

  if (transactions.length === 0) {
    return {
      totalTransactions: 0,
      totalDebits: 0,
      totalCredits: 0,
      avgMonthlySpending: "₹0",
      avgMonthlyIncome: "₹0",
      avgMonthlyBalance: formatCurrency(account.Summary.currentBalance || "0"),
      balanceTrend: "Stable",
      lastTransactionDate: "N/A",
      transactionPeriod: "N/A",
    };
  }

  // Calculate totals
  let totalDebitAmount = 0;
  let totalCreditAmount = 0;
  let debitCount = 0;
  let creditCount = 0;

  // Calculate monthly average balance by tracking balance over time
  const balancesByMonth = new Map<string, number[]>();

  transactions.forEach((txn) => {
    const amount = parseFloat(txn.amount);
    if (!isNaN(amount)) {
      if (txn.type === "DEBIT") {
        totalDebitAmount += amount;
        debitCount++;
      } else if (txn.type === "CREDIT") {
        totalCreditAmount += amount;
        creditCount++;
      }
    }

    // Track balance for monthly average calculation
    const balance = parseFloat(txn.currentBalance);
    if (!isNaN(balance)) {
      const txnDate = new Date(txn.transactionTimestamp);
      const monthKey = `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, "0")}`;

      if (!balancesByMonth.has(monthKey)) {
        balancesByMonth.set(monthKey, []);
      }
      balancesByMonth.get(monthKey)!.push(balance);
    }
  });

  // Get date range
  const startDate = account.Transactions.startDate;
  const endDate = account.Transactions.endDate;
  const lastTransaction = transactions[transactions.length - 1];
  const lastTxnDate = lastTransaction
    ? new Date(lastTransaction.transactionTimestamp).toLocaleDateString("en-IN")
    : "N/A";

  // Calculate months in period for averaging
  const start = new Date(startDate);
  const end = new Date(endDate);
  const monthsDiff =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1;
  const months = Math.max(monthsDiff, 1);

  // Calculate averages
  const avgMonthlySpending = formatCurrency(
    (totalDebitAmount / months).toFixed(2),
  );
  const avgMonthlyIncome = formatCurrency(
    (totalCreditAmount / months).toFixed(2),
  );

  // Calculate average monthly balance
  let totalBalanceSum = 0;
  let totalBalanceCount = 0;

  balancesByMonth.forEach((balances) => {
    // Average balance for this month
    const monthAvg =
      balances.reduce((sum, bal) => sum + bal, 0) / balances.length;
    totalBalanceSum += monthAvg;
    totalBalanceCount++;
  });

  const avgMonthlyBalance =
    totalBalanceCount > 0
      ? formatCurrency((totalBalanceSum / totalBalanceCount).toFixed(2))
      : formatCurrency(account.Summary.currentBalance || "0");

  // Determine balance trend
  const avgBalance =
    totalBalanceCount > 0
      ? totalBalanceSum / totalBalanceCount
      : currentBalance;
  const trendThreshold = avgBalance * 0.05; // 5% threshold for stability

  let balanceTrend: "Positive" | "Negative" | "Stable";
  if (currentBalance > avgBalance + trendThreshold) {
    balanceTrend = "Positive";
  } else if (currentBalance < avgBalance - trendThreshold) {
    balanceTrend = "Negative";
  } else {
    balanceTrend = "Stable";
  }

  return {
    totalTransactions: transactions.length,
    totalDebits: debitCount,
    totalCredits: creditCount,
    avgMonthlySpending,
    avgMonthlyIncome,
    avgMonthlyBalance,
    balanceTrend,
    lastTransactionDate: lastTxnDate,
    transactionPeriod: `${new Date(startDate).toLocaleDateString("en-IN")} to ${new Date(endDate).toLocaleDateString("en-IN")}`,
  };
}

/**
 * Account insights for chat analysis
 */
export interface AccountInsights {
  accountType: string;
  currentBalance: string;
  avgMonthlyBalance: string;
  balanceTrend: "Positive" | "Negative" | "Stable";
  totalTransactions: number;
  totalDebits: number;
  totalCredits: number;
  avgMonthlySpending: string;
  avgMonthlyIncome: string;
  lastTransactionDate: string;
  transactionPeriod: string;
}

/**
 * Transform bank accounts to insights format for chat analysis
 * Excludes sensitive information like bank name, account number, IFSC code
 */
export function transformBankAccountsToInsights(
  accounts: BankAccount[],
): AccountInsights[] {
  return accounts.map((account) => {
    const insights = calculateTransactionInsights(account);

    return {
      accountType: account.Summary.type || "UNKNOWN",
      currentBalance: formatCurrency(account.Summary.currentBalance) || "₹0",
      avgMonthlyBalance: insights.avgMonthlyBalance,
      balanceTrend: insights.balanceTrend,
      totalTransactions: insights.totalTransactions,
      totalDebits: insights.totalDebits,
      totalCredits: insights.totalCredits,
      avgMonthlySpending: insights.avgMonthlySpending,
      avgMonthlyIncome: insights.avgMonthlyIncome,
      lastTransactionDate: insights.lastTransactionDate,
      transactionPeriod: insights.transactionPeriod,
    };
  });
}

/**
 * Format account insights as natural text for chat
 */
export function formatAccountsAsText(insights: AccountInsights[]): string {
  if (insights.length === 0) return "No bank accounts found.";

  const lines: string[] = [];

  insights.forEach((account, index) => {
    lines.push(`Account ${index + 1} (${account.accountType}):`);
    lines.push(`  Current Balance: ${account.currentBalance}`);
    lines.push(`  Avg Monthly Balance: ${account.avgMonthlyBalance}`);
    lines.push(`  Balance Trend: ${account.balanceTrend}`);
    lines.push(`  Transaction Period: ${account.transactionPeriod}`);
    lines.push(
      `  Total Transactions: ${account.totalTransactions} (${account.totalDebits} debits, ${account.totalCredits} credits)`,
    );
    lines.push(`  Avg Monthly Spending: ${account.avgMonthlySpending}`);
    lines.push(`  Avg Monthly Income: ${account.avgMonthlyIncome}`);
    lines.push(`  Last Transaction: ${account.lastTransactionDate}`);
    lines.push("");
  });

  return lines.join("\n\n");
}
