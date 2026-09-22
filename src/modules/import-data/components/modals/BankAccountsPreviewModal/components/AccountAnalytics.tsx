/**
 * Account Analytics — the reference bank-analysis cards for one account:
 * balance trend, monthly cash flow, income vs expenses, spend by payment mode
 * and recent transactions, all computed from its transactions.
 */

"use client";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { ArrowUpRight, PieChart } from "lucide-react";
import { BankAccount } from "@/modules/import-data/types/bank-accounts";
import {
  ChartSkeleton,
  DataPanel,
  DonutBreakdown,
  MeterRow,
  Notice,
  formatINRShort,
} from "@/modules/import-data/components/shared/ui";
import {
  aggregateMonthlyData,
  prepareBalanceTrendData,
  processTransactionsForDisplay,
} from "../utils/transaction-analytics";
import { cashFlowOf, spendByMode } from "../utils/bank-insights";
import { TransactionsList } from "./TransactionsList";

// Both charts pull in recharts (large); load them only once an account's
// analytics are on screen.
const chartLoading = () => <ChartSkeleton />;
const BalanceTrendChart = dynamic(
  () => import("./BalanceTrendChart").then((m) => m.BalanceTrendChart),
  { ssr: false, loading: chartLoading },
);
const IncomeExpenseChart = dynamic(
  () => import("./IncomeExpenseChart").then((m) => m.IncomeExpenseChart),
  { ssr: false, loading: chartLoading },
);

export function AccountAnalytics({ account }: { account: BankAccount }) {
  const transactions = useMemo(
    () => account.Transactions?.Transaction || [],
    [account.Transactions?.Transaction],
  );
  const balanceTrendData = useMemo(
    () => prepareBalanceTrendData(transactions),
    [transactions],
  );
  const monthlyData = useMemo(
    () => aggregateMonthlyData(transactions),
    [transactions],
  );
  const recent = useMemo(
    () => processTransactionsForDisplay(transactions, 30),
    [transactions],
  );
  const flow = useMemo(() => cashFlowOf(transactions), [transactions]);
  const modes = useMemo(() => spendByMode(transactions), [transactions]);

  const startDate = account.Transactions?.startDate;
  const endDate = account.Transactions?.endDate;
  const income = Math.max(flow.avgIncome, 1);
  const rate = flow.savingsRate;

  // A fragment: every card is a direct child of the modal's scroll column.
  return (
    <>
      <BalanceTrendChart
        data={balanceTrendData}
        startDate={startDate}
        endDate={endDate}
      />

      <DataPanel
        title="Monthly Cash Flow"
        icon={ArrowUpRight}
        iconClassName="text-[#0A9E6E]"
        addon={`avg of ${flow.months} month${flow.months === 1 ? "" : "s"}`}
        bodyClassName="space-y-3"
      >
        <div className="space-y-2 text-[10px]">
          <MeterRow
            label="Monthly Income"
            valueLabel={formatINRShort(flow.avgIncome)}
            pct={flow.avgIncome > 0 ? 100 : 0}
            barClass="bg-[#063BAA]"
          />
          <MeterRow
            label="Monthly Expenses"
            valueLabel={formatINRShort(flow.avgExpenses)}
            pct={(flow.avgExpenses / income) * 100}
            barClass="bg-amber-500"
          />
          <MeterRow
            label="Net Savings"
            valueLabel={formatINRShort(flow.avgNet, { signed: true })}
            pct={(Math.max(flow.avgNet, 0) / income) * 100}
            barClass={flow.avgNet >= 0 ? "bg-[#0A9E6E]" : "bg-rose-500"}
          />
        </div>
        {rate !== null && (
          <Notice
            tone={rate >= 30 ? "success" : rate >= 0 ? "warning" : "danger"}
          >
            Savings rate: {rate.toFixed(1)}% —{" "}
            {rate >= 30
              ? "healthy, above the 30% benchmark"
              : rate >= 0
                ? "below the 30% benchmark"
                : "spending exceeded income"}
          </Notice>
        )}
      </DataPanel>

      <IncomeExpenseChart
        data={monthlyData}
        startDate={startDate}
        endDate={endDate}
      />

      {modes.length > 0 && (
        <DataPanel
          title="Spending by Mode"
          icon={PieChart}
          iconClassName="text-amber-500"
          addon={formatINRShort(flow.expenses)}
        >
          <DonutBreakdown segments={modes} />
        </DataPanel>
      )}

      <TransactionsList transactions={recent} />
    </>
  );
}
