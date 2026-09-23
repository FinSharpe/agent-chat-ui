/**
 * Transactions List — recent transactions as hairline-separated rows (the
 * reference list style): a tinted in/out arrow, narration over date · mode,
 * the signed amount and the running balance.
 */

"use client";
import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DataPanel,
  formatINR,
} from "@/modules/import-data/components/shared/ui";
import { ProcessedTransaction } from "../utils/transaction-analytics";

interface TransactionsListProps {
  transactions: ProcessedTransaction[];
  className?: string;
  /** Rows shown before "Show more". */
  initialRows?: number;
}

function TransactionRow({
  transaction,
}: {
  transaction: ProcessedTransaction;
}) {
  const isCredit = transaction.type === "CREDIT";
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isCredit
            ? "bg-[#97edcc]/30 text-[#0A9E6E]"
            : "bg-rose-50 text-rose-500 dark:bg-rose-500/10",
        )}
      >
        {isCredit ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className="text-forest-deep truncate text-[11px] font-medium dark:text-white"
          title={
            transaction.reference ? `Ref: ${transaction.reference}` : undefined
          }
        >
          {transaction.narration || "No description"}
        </p>
        <p className="truncate text-[9px] text-slate-400">
          {transaction.formattedDate} · {transaction.formattedTime}
          {transaction.mode ? ` · ${transaction.mode}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={cn(
            "text-[11px] font-medium tabular-nums",
            isCredit ? "text-[#0A9E6E]" : "text-rose-500",
          )}
        >
          {isCredit ? "+" : "-"}
          {formatINR(transaction.parsedAmount, { maxDecimals: 2 })}
        </p>
        <p className="text-[9px] text-slate-400 tabular-nums">
          Bal {formatINR(transaction.parsedBalance)}
        </p>
      </div>
    </div>
  );
}

export function TransactionsList({
  transactions,
  className,
  initialRows = 6,
}: TransactionsListProps) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? transactions : transactions.slice(0, initialRows);

  return (
    <DataPanel
      title="Recent Transactions"
      icon={Receipt}
      iconClassName="text-slate-400"
      addon={transactions.length ? `${transactions.length} latest` : undefined}
      className={className}
    >
      {transactions.length === 0 ? (
        <p className="py-8 text-center text-[11px] text-slate-400">
          No transactions available
        </p>
      ) : (
        <div className="space-y-2">
          <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
            {rows.map((t, i) => (
              <TransactionRow
                key={`${t.txnId}-${i}`}
                transaction={t}
              />
            ))}
          </div>
          {transactions.length > initialRows && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex w-full items-center justify-center gap-1 text-[10px] font-medium text-[#063BAA] hover:underline dark:text-[#8FB4FF]"
            >
              {expanded ? (
                <>
                  <span>Show fewer</span>
                  <ChevronUp size={11} />
                </>
              ) : (
                <>
                  <span>Show all {transactions.length}</span>
                  <ChevronDown size={11} />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </DataPanel>
  );
}
