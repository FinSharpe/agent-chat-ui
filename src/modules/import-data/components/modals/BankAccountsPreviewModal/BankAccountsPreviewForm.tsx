/**
 * Bank Accounts Preview Form — the bank analysis in finsharpe-mobile's layout
 * (see BankOverview), with the accounts editable for import (X leaves one
 * out) and Import to Chat pinned below. The header's close button leaves.
 */

"use client";
import { Building2 } from "lucide-react";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import {
  BankAccountWithFormData,
  BankAccountsFiDataResponse,
} from "@/modules/import-data/types/bank-accounts";
import {
  CardListSkeleton,
  ChartSkeleton,
  EmptyState,
  FooterButton,
  OverlayBody,
  OverlayFooter,
  OverlayHeader,
  StatTileGridSkeleton,
  formatINRShort,
} from "@/modules/import-data/components/shared/ui";
import {
  extractBankBalanceFromFiData,
  transformFormDataToBankAccounts,
} from "./utils/bank-accounts-transformer";
import {
  useHoldingsForm,
  HoldingFormData,
} from "../HoldingsPreviewModal/hooks/useHoldingsForm";
import { BankOverview } from "./components/BankOverview";

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
  const accounts = fields as unknown as BankAccountWithFormData[];
  const count = accounts.length;

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
        formatINRShort(extractBankBalanceFromFiData(accounts) ?? 0),
        `${count} account${count === 1 ? "" : "s"}`,
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
          <BankOverview
            accounts={accounts}
            onRemove={handleRemoveHolding}
          />
        )}
      </OverlayBody>

      <OverlayFooter>
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
