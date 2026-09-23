"use client";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BankAccountWithFormData } from "@/modules/import-data/types/bank-accounts";
import {
  DataPanel,
  formatINRShort,
} from "@/modules/import-data/components/shared/ui";
import { balanceOf, cashFlowOf, hasTransactions } from "../utils/bank-insights";

const TYPE_LABEL: Record<string, string> = {
  SAVINGS: "Savings",
  CURRENT: "Current",
  SALARY: "Salary",
};

/**
 * The reference "Accounts" list: a coloured bar marking the account being
 * inspected, bank + type/number, balance and the period's net flow. Rows
 * select the account the analytics below describe; the X drops an account
 * from the import.
 */
export function AccountsList({
  accounts,
  selectedIndex,
  onSelect,
  onRemove,
}: {
  accounts: BankAccountWithFormData[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <DataPanel
      title="Accounts"
      addon={`${accounts.length} account${accounts.length === 1 ? "" : "s"}`}
    >
      <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
        {accounts.map((a, index) => {
          const selected = index === selectedIndex;
          const txns = a.Transactions?.Transaction ?? [];
          const net = hasTransactions(a) ? cashFlowOf(txns) : null;
          const netTotal = net ? net.income - net.expenses : null;
          return (
            <div
              key={`${a.maskedAccountNumber}-${index}`}
              className="flex items-center gap-1"
            >
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-pressed={selected}
                className="flex min-w-0 flex-1 items-center justify-between gap-2 py-2.5 text-left"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "w-1 self-stretch rounded-full",
                      selected
                        ? "bg-[#063BAA]"
                        : "bg-slate-200 dark:bg-slate-700",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-forest-deep flex items-center gap-1.5 truncate text-[11px] font-medium dark:text-white">
                      <span className="truncate">
                        {a.displayBank || "Bank account"}
                      </span>
                      {selected && (
                        <span className="shrink-0 rounded-full bg-[#063BAA]/8 px-1.5 py-0.5 text-[8px] font-medium tracking-wider text-[#063BAA] uppercase">
                          Viewing
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[9px] text-slate-400">
                      {TYPE_LABEL[a.displayAccountType] ??
                        a.displayAccountType ??
                        "Account"}
                      {a.displayAccountNumber
                        ? ` · ${a.displayAccountNumber}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-forest-deep text-[11px] font-medium tabular-nums dark:text-white">
                    {formatINRShort(balanceOf(a))}
                  </p>
                  <p
                    className={cn(
                      "text-[9px] font-medium tabular-nums",
                      netTotal === null
                        ? "text-slate-400"
                        : netTotal >= 0
                          ? "text-[#0A9E6E]"
                          : "text-rose-500",
                    )}
                  >
                    {netTotal === null
                      ? "No transactions"
                      : `${formatINRShort(netTotal, { signed: true })} (${net!.months}m)`}
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Remove ${a.displayBank ?? "account"}`}
                title="Remove from import"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </DataPanel>
  );
}
