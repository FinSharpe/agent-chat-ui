/**
 * Account Analytics Container Component
 * Combines all analytics visualizations for a single bank account
 */

"use client";
import { BankAccount } from "@/modules/import-data/types/bank-accounts";
import {
  ArrowRightLeft,
  Calendar,
  Info,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  aggregateMonthlyData,
  calculateTransactionStats,
  formatCurrency,
  formatDuration,
  prepareBalanceTrendData,
  processTransactionsForDisplay,
} from "../utils/transaction-analytics";
import dynamic from "next/dynamic";
import { TransactionsList } from "./TransactionsList";

// Both charts pull in recharts (large). Load them only when a bank account's
// analytics are expanded, keeping recharts out of the preview-modal bundle.
const chartLoading = () => (
  <div className="h-64 w-full animate-pulse rounded-md bg-gray-100" />
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
 * Stats Card Component
 * Modern card design for financial statistics using app theme colors
 */
function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  tooltip,
  className = "",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
  tooltip?: string;
  className?: string;
}) {
  // Use theme colors based on trend
  const getTrendStyles = () => {
    switch (trend) {
      case "up":
        return {
          bgGradient: "bg-gradient-to-br from-accent/30 to-accent/10 dark:from-accent/10 dark:to-accent/5",
          border: "border-border/50",
          iconBg: "bg-accent dark:bg-accent/20",
          icon: "text-foreground dark:text-foreground",
          value: "text-foreground dark:text-foreground",
        };
      case "down":
        return {
          bgGradient: "bg-gradient-to-br from-destructive/5 to-destructive/[0.02] dark:from-destructive/10 dark:to-destructive/5",
          border: "border-destructive/20 dark:border-destructive/30",
          iconBg: "bg-destructive/10 dark:bg-destructive/20",
          icon: "text-destructive dark:text-destructive-foreground",
          value: "text-destructive dark:text-destructive-foreground",
        };
      default: // neutral
        return {
          bgGradient: "bg-gradient-to-br from-muted/50 to-muted/20 dark:from-muted/20 dark:to-muted/10",
          border: "border-border/50",
          iconBg: "bg-muted dark:bg-muted/40",
          icon: "text-muted-foreground dark:text-muted-foreground",
          value: "text-foreground dark:text-foreground",
        };
    }
  };

  const styles = getTrendStyles();

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${styles.border} ${styles.bgGradient} p-4 md:p-5 ${className}`}
    >
      {/* Icon Badge */}
      <div
        className={`inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg ${styles.iconBg} mb-3 md:mb-4`}
      >
        <Icon className={`w-5 h-5 md:w-6 md:h-6 ${styles.icon}`} />
      </div>

      {/* Content */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center hover:opacity-70 transition-opacity"
                  aria-label={`Information about ${label}`}
                >
                  <Info className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs md:max-w-sm">
                <p className="text-xs leading-relaxed">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <p
          className={`text-xl md:text-3xl font-bold ${styles.value} break-words`}
        >
          {value}
        </p>
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-5 dark:opacity-[0.02]">
        <div className={`w-full h-full rounded-full blur-2xl ${styles.iconBg}`} />
      </div>
    </div>
  );
}

/**
 * Account Analytics Component
 */
export function AccountAnalytics({ account, className }: AccountAnalyticsProps) {
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
      <div className={`p-8 text-center ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">
          No transaction data available for this account
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 md:space-y-6 ${className}`}>
      {/* Date Range Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-blue-900 dark:text-blue-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium">
              Transaction History: {startDate} to {endDate}
            </span>
          </div>
          <span className="sm:ml-auto text-xs sm:text-sm text-blue-700 dark:text-blue-300">
            {stats.transactionCount} transactions
          </span>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <StatsCard
          label="Total Income"
          value={formatCurrency(stats.totalIncome)}
          icon={TrendingUp}
          trend="up"
          tooltip={`Sum of all positive transactions (credits) during the period from ${startDate} to ${endDate}${duration ? ` (${duration})` : ""}. This represents money that came into your account, including salary deposits, transfers received, refunds, and other income.`}
        />
        <StatsCard
          label="Total Expenses"
          value={formatCurrency(stats.totalExpenses)}
          icon={TrendingDown}
          trend="down"
          tooltip={`Sum of all negative transactions (debits) during the period from ${startDate} to ${endDate}${duration ? ` (${duration})` : ""}. This represents money that went out of your account, including purchases, withdrawals, bill payments, and other expenses.`}
        />
        <StatsCard
          label="Net Cash Flow"
          value={formatCurrency(stats.netFlow)}
          icon={ArrowRightLeft}
          trend={stats.netFlow >= 0 ? "up" : "down"}
          tooltip={`The difference between Total Income and Total Expenses (Income - Expenses) for the period from ${startDate} to ${endDate}${duration ? ` (${duration})` : ""}. A positive value indicates you received more money than you spent, while a negative value means you spent more than you received.`}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
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
      <TransactionsList transactions={recentTransactions} maxHeight="500px" />
    </div>
  );
}
