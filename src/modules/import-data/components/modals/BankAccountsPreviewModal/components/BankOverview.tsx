"use client";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { BankAccountWithFormData } from "@/modules/import-data/types/bank-accounts";
import {
  ChartSkeleton,
  StatTile,
  formatINRShort,
} from "@/modules/import-data/components/shared/ui";
import { extractBankBalanceFromFiData } from "../utils/bank-accounts-transformer";
import {
  allTransactions,
  combinedBalanceTrend,
  latestMonthFlow,
} from "../utils/bank-overview";
import {
  aggregateMonthlyData,
  processTransactionsForDisplay,
} from "../utils/transaction-analytics";
import { AccountsList } from "./AccountsList";
import { TransactionsList } from "./TransactionsList";

// Both charts pull in recharts (large); load them once the view is open.
const chartLoading = () => <ChartSkeleton />;
const BalanceTrendChart = dynamic(
  () => import("./BalanceTrendChart").then((m) => m.BalanceTrendChart),
  { ssr: false, loading: chartLoading },
);
const IncomeExpenseChart = dynamic(
  () => import("./IncomeExpenseChart").then((m) => m.IncomeExpenseChart),
  { ssr: false, loading: chartLoading },
);

/**
 * The bank view in finsharpe-mobile's order (`cash_screen.dart`): total cash,
 * the combined balance trend, the latest month's money in and out, money flow
 * by month, the accounts, recent transactions across them, and where the data
 * came from.
 */
export function BankOverview({
  accounts,
  onRemove,
}: {
  accounts: BankAccountWithFormData[];
  onRemove: (index: number) => void;
}) {
  const total = extractBankBalanceFromFiData(accounts) ?? 0;
  const txns = useMemo(() => allTransactions(accounts), [accounts]);
  const trend = useMemo(() => combinedBalanceTrend(accounts), [accounts]);
  const month = useMemo(() => latestMonthFlow(txns), [txns]);
  const monthly = useMemo(() => aggregateMonthlyData(txns), [txns]);
  const recent = useMemo(() => processTransactionsForDisplay(txns, 30), [txns]);
  const first = txns[0]?.transactionTimestamp;
  const last = txns[txns.length - 1]?.transactionTimestamp;
  const count = accounts.length;

  return (
    <>
      <StatTile
        label="Total cash"
        value={formatINRShort(total)}
        hint={`${count} account${count === 1 ? "" : "s"}`}
      />

      {trend.points.length >= 2 && (
        <BalanceTrendChart
          data={trend.points}
          startDate={trend.points[0].date}
          endDate={trend.points[trend.points.length - 1].date}
          caption={
            trend.accounts === 1
              ? "Balance over the shared statement period."
              : `Combined balance across the ${trend.accounts} accounts that shared transactions, over their shared statement period.`
          }
        />
      )}

      {month && (
        <div className="grid grid-cols-2 gap-2">
          <StatTile
            label={`Money in · ${month.label}`}
            value={formatINRShort(month.moneyIn)}
            intent="positive"
          />
          <StatTile
            label={`Money out · ${month.label}`}
            value={formatINRShort(month.moneyOut)}
            intent="negative"
          />
        </div>
      )}

      {monthly.length > 0 && (
        <IncomeExpenseChart
          data={monthly}
          startDate={first}
          endDate={last}
        />
      )}

      <AccountsList
        accounts={accounts}
        onRemove={onRemove}
      />

      {recent.length > 0 && (
        <TransactionsList
          transactions={recent}
          initialRows={8}
        />
      )}

      <p className="text-[10px] leading-relaxed text-slate-400">
        Balances and transactions come from your bank through the Account
        Aggregator. FinSharpe cannot move money or see your login details.
      </p>
    </>
  );
}
