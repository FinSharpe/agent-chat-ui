/**
 * Account Analytics Container Component
 * Combines all analytics visualizations for a single bank account
 */

"use client";
import { BankAccount } from "@/modules/import-data/types/bank-accounts";
import {
  ArrowRightLeft,
  Calendar,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import {
  StatTile,
  formatINR,
  formatCount,
} from "@/modules/import-data/components/shared/ui";
import {
  aggregateMonthlyData,
  calculateTransactionStats,
  formatDuration,
  prepareBalanceTrendData,
  processTransactionsForDisplay,
} from "../utils/transaction-analytics";
import dynamic from "next/dynamic";
import { TransactionsList } from "./TransactionsList";

// Both charts pull in recharts (large). Load them only when a bank account's
// analytics are expanded, keeping recharts out of the preview-modal bundle.
const chartLoading = () => (
  <div className="border-border bg-bg-subtle h-64 w-full animate-pulse rounded-xl border" />
);
const BalanceTrendChart = dynamic(
  () => import("./BalanceTrendChart").then((m) => m.BalanceTrendChart),
  { ssr: false, loading: chartLoading },
);
const IncomeExpenseChart = dynamic(
  () => import("./IncomeExpenseChart").then((m) => m.IncomeExpenseChart),
  { ssr: false, loading: chartLoading },
);

interface AccountAnalyticsProps {
  account: BankAccount;
  className?: string;
}

/**
 * Account Analytics Component
 */
export function AccountAnalytics({
  account,
  className,
}: AccountAnalyticsProps) {
  // Extract transactions (memoized to prevent recreating array on every render)
  const transactions = useMemo(
    () => account.Transactions?.Transaction || [],
    [account.Transactions?.Transaction],
  );

  // Prepare data for visualizations (memoized)
  const balanceTrendData = useMemo(
    () => prepareBalanceTrendData(transactions),
    [transactions],
  );

  const monthlyData = useMemo(
    () => aggregateMonthlyData(transactions),
    [transactions],
  );

  const recentTransactions = useMemo(
    () => processTransactionsForDisplay(transactions, 15),
    [transactions],
  );

  const stats = useMemo(
    () => calculateTransactionStats(transactions),
    [transactions],
  );

  // Date range
  const startDate = account.Transactions?.startDate;
  const endDate = account.Transactions?.endDate;

  // Calculate duration
  const duration = useMemo(() => {
    if (startDate && endDate) {
      return formatDuration(startDate, endDate);
    }
    return "";
  }, [startDate, endDate]);

  if (!transactions || transactions.length === 0) {
    return (
      <div className={`p-8 text-center ${className ?? ""}`}>
        <p className="text-text-tertiary text-sm">
          No transaction data available for this account
        </p>
      </div>
    );
  }

  const periodSuffix = `during the period from ${startDate} to ${endDate}${duration ? ` (${duration})` : ""}.`;

  return (
    <div className={`space-y-4 md:space-y-5 ${className ?? ""}`}>
      {/* Date Range Banner */}
      <div className="border-border bg-card flex flex-col gap-1.5 rounded-xl border px-3.5 py-2.5 shadow-sm sm:flex-row sm:items-center">
        <div className="text-text-secondary flex items-center gap-2">
          <Calendar className="text-text-tertiary h-4 w-4 shrink-0" />
          <span className="text-xs font-medium sm:text-sm">
            {startDate} &ndash; {endDate}
          </span>
        </div>
        <span className="text-text-tertiary text-xs sm:ml-auto">
          {formatCount(stats.transactionCount)} transactions
        </span>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatTile
          label="Total Income"
          value={formatINR(stats.totalIncome)}
          icon={TrendingUp}
          intent="positive"
          tooltip={`Sum of all credits ${periodSuffix} Money in: salary, transfers received, refunds, and other income.`}
        />
        <StatTile
          label="Total Expenses"
          value={formatINR(stats.totalExpenses)}
          icon={TrendingDown}
          intent="negative"
          tooltip={`Sum of all debits ${periodSuffix} Money out: purchases, withdrawals, bill payments, and other expenses.`}
        />
        <StatTile
          label="Net Cash Flow"
          value={formatINR(stats.netFlow)}
          icon={ArrowRightLeft}
          intent={stats.netFlow >= 0 ? "positive" : "negative"}
          tooltip={`Income minus Expenses ${periodSuffix} A positive value means you received more than you spent.`}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BalanceTrendChart
          data={balanceTrendData}
          startDate={startDate}
          endDate={endDate}
        />
        <IncomeExpenseChart
          data={monthlyData}
          startDate={startDate}
          endDate={endDate}
        />
      </div>

      {/* Recent Transactions */}
      <TransactionsList
        transactions={recentTransactions}
        maxHeight="500px"
      />
    </div>
  );
}
