/**
 * Bank Accounts Preview Form
 * Left "ledger" lists the accounts; selecting one drives its spending analytics
 * (income/expense, balance trend, transactions) in the right canvas.
 */

"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { BarChart3, Building2, Loader2, Trash2 } from "lucide-react";
import {
  BankAccountWithFormData,
  BankAccountsFiDataResponse,
} from "@/modules/import-data/types/bank-accounts";
import {
  WorkspaceHeader,
  WorkspaceSplit,
  WorkspaceColumn,
  WorkspaceFooter,
  EmptyState,
  CardListSkeleton,
  formatINR,
  formatCount,
  type WorkspaceMetric,
} from "@/modules/import-data/components/shared/ui";
import {
  extractBankBalanceFromFiData,
  transformFormDataToBankAccounts,
} from "./utils/bank-accounts-transformer";
import {
  useHoldingsForm,
  HoldingFormData,
} from "../HoldingsPreviewModal/hooks/useHoldingsForm";
import { AccountAnalytics } from "./components/AccountAnalytics";

type BankAccountsPreviewFormProps = {
  defaultValues: BankAccountWithFormData[];
  fiData: BankAccountsFiDataResponse | undefined;
  isLoading: boolean;
  isImporting: boolean;
  onSubmit: (modifiedFiData: BankAccountsFiDataResponse) => void;
  onClose: () => void;
};

function hasTransactions(account: BankAccountWithFormData): boolean {
  return (account.Transactions?.Transaction?.length ?? 0) > 0;
}

export function BankAccountsPreviewForm({
  defaultValues,
  fiData,
  isLoading,
  isImporting,
  onSubmit,
  onClose,
}: BankAccountsPreviewFormProps) {
  const { handleSubmit, fields, handleRemoveHolding } = useHoldingsForm(
    defaultValues as never,
    ConsentType.BANK_ACCOUNTS,
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const accounts = fields as unknown as BankAccountWithFormData[];
  const count = accounts.length;
  // Shared with the My-Networth aggregator so the two totals can never drift.
  const totalBalance = extractBankBalanceFromFiData(accounts) ?? 0;
  const insightCount = accounts.filter(hasTransactions).length;

  const safeIndex = Math.min(selectedIndex, Math.max(count - 1, 0));
  const selected = accounts[safeIndex];

  const handleFormSubmit = (data: HoldingFormData) => {
    if (!fiData) return;
    const convertedAccounts = transformFormDataToBankAccounts(
      data.holdings as unknown as BankAccountWithFormData[],
    );
    onSubmit(convertedAccounts);
  };

  const metrics: WorkspaceMetric[] = [
    { label: "Accounts", value: count },
    { label: "Total balance", value: formatINR(totalBalance) },
    { label: "With insights", value: insightCount },
  ];

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <WorkspaceHeader
        icon={Building2}
        eyebrow="Import · Bank & Spending"
        title="Bank Accounts"
        metrics={isLoading ? undefined : metrics}
        srDescription="Review your balances and transaction insights before importing"
      />

      <WorkspaceSplit
        ledgerTab="Accounts"
        canvasTab="Spending"
        ledger={
          <WorkspaceColumn
            label="Accounts"
            addon={
              <span className="text-text-muted text-xs">select to inspect</span>
            }
          >
            {isLoading ? (
              <CardListSkeleton count={3} />
            ) : count === 0 ? (
              <EmptyState
                icon={Building2}
                title="No bank accounts found"
                description="There are no linked deposit accounts to preview for this connection."
                className="border-border bg-card rounded-xl border border-dashed"
              />
            ) : (
              <div className="border-border bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
                <div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
                  {accounts.map((account, index) => {
                    const isSelected = index === safeIndex;
                    const txns = hasTransactions(account);
                    return (
                      <div
                        key={index}
                        className={cn(
                          "border-border-subtle flex items-center gap-1 border-b px-2 transition-colors last:border-b-0",
                          isSelected ? "bg-primary/10" : "hover:bg-bg-hover",
                        )}
                        style={
                          isSelected
                            ? { boxShadow: "inset 3px 0 0 var(--primary)" }
                            : undefined
                        }
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedIndex(index)}
                          className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-1.5 text-left"
                          aria-pressed={isSelected}
                        >
                          <span className="bg-secondary text-secondary-foreground inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                            <Building2 className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="text-text-primary block truncate text-sm font-semibold">
                              {account.displayBank || "Unknown Bank"}
                            </span>
                            <span className="text-text-muted block truncate text-xs">
                              {account.displayAccountType || "Account"}
                              {account.displayAccountNumber
                                ? ` · ${account.displayAccountNumber}`
                                : ""}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="text-text-primary block text-sm font-semibold tabular-nums">
                              {account.displayBalance || "—"}
                            </span>
                            {txns && (
                              <span className="text-text-muted block text-[11px]">
                                insights
                              </span>
                            )}
                          </span>
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveHolding(index)}
                          aria-label="Remove account"
                          className="text-text-tertiary hover:bg-error-bg hover:text-error-fg h-8 w-8 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <div className="border-border text-text-tertiary flex items-center justify-between border-t px-3 py-2.5 text-xs">
                  <span>
                    {formatCount(count)} account{count === 1 ? "" : "s"}
                  </span>
                  <span className="tabular-nums">
                    {formatINR(totalBalance)}
                  </span>
                </div>
              </div>
            )}
          </WorkspaceColumn>
        }
        canvas={
          <WorkspaceColumn
            label={
              selected
                ? `${selected.displayBank ?? "Account"}${selected.displayAccountNumber ? ` · ${selected.displayAccountNumber}` : ""}`
                : "Spending Analysis"
            }
          >
            {isLoading ? (
              <div className="border-border bg-card/40 flex h-full min-h-0 items-center justify-center rounded-xl border border-dashed">
                <p className="text-text-muted text-sm">Loading accounts…</p>
              </div>
            ) : !selected ? (
              <div className="border-border bg-card/40 flex h-full min-h-0 items-center justify-center rounded-xl border border-dashed p-8 text-center">
                <p className="text-text-muted text-sm">
                  Select an account to see its spending analytics.
                </p>
              </div>
            ) : hasTransactions(selected) ? (
              <div className="scrollbar-thin animate-fade-in-up -mr-1.5 min-h-0 flex-1 overflow-y-auto pr-1.5">
                <AccountAnalytics account={selected} />
              </div>
            ) : (
              <div className="border-border bg-card/40 flex h-full min-h-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center">
                <span className="bg-muted text-text-tertiary inline-flex h-12 w-12 items-center justify-center rounded-2xl">
                  <BarChart3 className="h-6 w-6" />
                </span>
                <p className="text-text-primary text-sm font-medium">
                  No transaction analytics
                </p>
                <p className="text-text-tertiary max-w-xs text-sm">
                  This account didn&apos;t return transaction history to
                  analyse. Its balance is still included on import.
                </p>
              </div>
            )}
          </WorkspaceColumn>
        }
      />

      <WorkspaceFooter
        start={
          !isLoading && count > 0
            ? `${formatCount(count)} account${count === 1 ? "" : "s"} · ${formatINR(totalBalance)} total balance`
            : null
        }
      >
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isImporting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || count === 0 || isImporting}
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding to Chat…
            </>
          ) : (
            "Add to Chat & Analyze"
          )}
        </Button>
      </WorkspaceFooter>
    </form>
  );
}
