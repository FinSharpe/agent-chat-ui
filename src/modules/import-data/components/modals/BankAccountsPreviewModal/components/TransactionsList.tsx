/**
 * Transactions List Component
 * Displays recent transactions in a scrollable list
 */

"use client";
import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DataPanel,
  formatINR,
  formatCount,
} from "@/modules/import-data/components/shared/ui";
import { ProcessedTransaction } from "../utils/transaction-analytics";

interface TransactionsListProps {
  transactions: ProcessedTransaction[];
  className?: string;
  maxHeight?: string;
}

/**
 * Transaction row component
 */
function TransactionRow({
  transaction,
}: {
  transaction: ProcessedTransaction;
}) {
  const isCredit = transaction.type === "CREDIT";

  return (
    <div className="hover:bg-bg-hover flex items-start gap-3 px-3 py-3 transition-colors">
      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 rounded-full p-2",
          isCredit ? "bg-success-bg" : "bg-error-bg",
        )}
      >
        {isCredit ? (
          <ArrowDownLeft className="text-success-fg h-4 w-4" />
        ) : (
          <ArrowUpRight className="text-error-fg h-4 w-4" />
        )}
      </div>

      {/* Transaction details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-text-primary truncate text-sm font-medium">
              {transaction.narration || "No description"}
            </p>
            <p className="text-text-tertiary mt-0.5 text-xs">
              {transaction.formattedDate} • {transaction.formattedTime}
            </p>
            {transaction.mode && (
              <p className="text-text-muted mt-0.5 text-xs">
                via {transaction.mode}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="text-right">
            <p
              className={cn(
                "text-sm font-semibold tabular-nums",
                isCredit ? "text-success-fg" : "text-error-fg",
              )}
            >
              {isCredit ? "+" : "-"}
              {formatINR(transaction.parsedAmount, { maxDecimals: 2 })}
            </p>
            <p className="text-text-tertiary mt-0.5 text-xs tabular-nums">
              Bal: {formatINR(transaction.parsedBalance, { maxDecimals: 2 })}
            </p>
          </div>
        </div>

        {/* Reference (if available) */}
        {transaction.reference && (
          <p className="text-text-muted mt-1 truncate text-xs">
            Ref: {transaction.reference}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Transactions List Component
 */
export function TransactionsList({
  transactions,
  className,
  maxHeight = "400px",
}: TransactionsListProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <DataPanel
        title="Recent Transactions"
        icon={Receipt}
        className={className}
      >
        <div className="text-text-tertiary flex h-[160px] items-center justify-center text-sm">
          No transactions available
        </div>
      </DataPanel>
    );
  }

  return (
    <DataPanel
      title="Recent Transactions"
      icon={Receipt}
      className={className}
      noPadding
      addon={
        <span className="text-text-tertiary text-xs">
          {formatCount(transactions.length)} shown
        </span>
      }
    >
      <div
        style={{ maxHeight }}
        className="scrollbar-thin overflow-y-auto"
      >
        <div className="divide-border-subtle divide-y">
          {transactions.map((transaction, index) => (
            <TransactionRow
              key={`${transaction.txnId}-${index}`}
              transaction={transaction}
            />
          ))}
        </div>
      </div>
    </DataPanel>
  );
}
