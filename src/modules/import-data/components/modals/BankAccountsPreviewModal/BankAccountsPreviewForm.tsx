/**
 * Bank Accounts Preview Form — the reference "Bank Account Analysis" popup
 * with real data: cash-flow stat tiles across accounts, the accounts list
 * (select one to inspect, X to leave it out of the import), that account's
 * analytics cards, overall observations, and Cancel / Import to Chat.
 */

"use client";
import { useMemo, useState } from "react";
import { Building2, Landmark } from "lucide-react";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import {
  BankAccountWithFormData,
  BankAccountsFiDataResponse,
} from "@/modules/import-data/types/bank-accounts";
import {
  CardListSkeleton,
  ChartSkeleton,
  DataPanel,
  EmptyState,
  FlagList,
  FooterButton,
  OverlayBody,
  OverlayFooter,
  OverlayHeader,
  StatGrid,
  StatTile,
  StatTileGridSkeleton,
  formatINRShort,
} from "@/modules/import-data/components/shared/ui";
import { transformFormDataToBankAccounts } from "./utils/bank-accounts-transformer";
import { hasTransactions, summariseAccounts } from "./utils/bank-insights";
import {
  useHoldingsForm,
  HoldingFormData,
} from "../HoldingsPreviewModal/hooks/useHoldingsForm";
import { AccountAnalytics } from "./components/AccountAnalytics";
import { AccountsList } from "./components/AccountsList";

type BankAccountsPreviewFormProps = {
  defaultValues: BankAccountWithFormData[];
  fiData: BankAccountsFiDataResponse | undefined;
  isLoading: boolean;
  isImporting: boolean;
  onSubmit: (modifiedFiData: BankAccountsFiDataResponse) => void;
  onClose: () => void;
};

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
  const summary = useMemo(() => summariseAccounts(accounts), [accounts]);
  const safeIndex = Math.min(selectedIndex, Math.max(count - 1, 0));
  const selected = accounts[safeIndex];
  const { flow, emergencyMonths, totalBalance } = summary;

  const handleFormSubmit = (data: HoldingFormData) => {
    if (!fiData) return;
    onSubmit(
      transformFormDataToBankAccounts(
        data.holdings as unknown as BankAccountWithFormData[],
      ),
    );
  };

  const subtitle = isLoading
    ? "Loading accounts…"
    : [
        formatINRShort(totalBalance),
        flow?.savingsRate != null
          ? `${flow.savingsRate.toFixed(1)}% savings`
          : `${count} account${count === 1 ? "" : "s"}`,
      ].join(" • ");

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <OverlayHeader
        title="Bank Account Analysis"
        subtitle={subtitle}
        onClose={onClose}
      />

      <OverlayBody>
        {isLoading ? (
          <>
            <StatTileGridSkeleton />
            <CardListSkeleton count={3} />
            <ChartSkeleton />
          </>
        ) : count === 0 ? (
          <EmptyState
            icon={Building2}
            title="No bank accounts found"
            description="There are no linked deposit accounts to preview for this connection."
            className="py-16"
          />
        ) : (
          <>
            <StatGrid>
              <StatTile
                label="Total Balance"
                value={formatINRShort(totalBalance)}
                hint={`${count} account${count === 1 ? "" : "s"}`}
              />
              <StatTile
                label="Monthly Savings"
                value={
                  flow ? formatINRShort(flow.avgNet, { signed: true }) : "—"
                }
                intent={
                  !flow ? "neutral" : flow.avgNet >= 0 ? "positive" : "negative"
                }
                hint={
                  flow?.savingsRate != null
                    ? `${flow.savingsRate.toFixed(1)}% savings rate`
                    : "no transactions"
                }
                tooltip="Average monthly credits minus debits across accounts with transactions"
              />
              <StatTile
                label="Emergency Cover"
                value={
                  emergencyMonths === null
                    ? "—"
                    : `${emergencyMonths.toFixed(1)} mo`
                }
                intent={
                  emergencyMonths === null
                    ? "neutral"
                    : emergencyMonths < 6
                      ? "warning"
                      : "positive"
                }
                hint="of monthly expenses"
                tooltip="Total balance divided by average monthly spending"
              />
            </StatGrid>

            <AccountsList
              accounts={accounts}
              selectedIndex={safeIndex}
              onSelect={setSelectedIndex}
              onRemove={handleRemoveHolding}
            />

            {selected && hasTransactions(selected) ? (
              <AccountAnalytics
                key={`${selected.maskedAccountNumber}-${safeIndex}`}
                account={selected}
              />
            ) : (
              <div className="glass-card rounded-card">
                <EmptyState
                  icon={Landmark}
                  title="No transaction history"
                  description={`${selected?.displayBank ?? "This account"} didn't share transactions to analyse. Its balance is still included on import.`}
                />
              </div>
            )}

            <DataPanel title="Observations">
              <FlagList flags={summary.flags} />
            </DataPanel>
          </>
        )}
      </OverlayBody>

      <OverlayFooter>
        <FooterButton
          variant="secondary"
          onClick={onClose}
          disabled={isImporting}
        >
          Cancel
        </FooterButton>
        <FooterButton
          type="submit"
          disabled={isLoading || count === 0 || isImporting}
          busy={isImporting}
          busyLabel="Importing…"
        >
          Import to Chat
        </FooterButton>
      </OverlayFooter>
    </form>
  );
}
