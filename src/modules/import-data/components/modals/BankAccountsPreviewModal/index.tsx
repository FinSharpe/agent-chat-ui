/**
 * Bank Accounts Preview Modal - Container Component
 * Opens a full-screen "Analysis Workspace": account list + per-account spending
 * analytics. Handles modal state, data fetching, and submission.
 */

"use client";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import useModalState from "@/hooks/useModalState";
import { BaseAnalysisModalProps } from "@/modules/import-data/types";
import { FiDataErrorState } from "@/modules/import-data/components/shared/FiDataErrorState";
import {
  WorkspaceHeader,
  workspaceDialogContentClass,
} from "@/modules/import-data/components/shared/ui";
import { BarChart3, CreditCard } from "lucide-react";
import { BankAccountsPreviewForm } from "./BankAccountsPreviewForm";
import { useBankAccountsData } from "./hooks/useBankAccountsData";
import { useImportBankAccountsMutation } from "./hooks/useImportBankAccountsMutation";

/**
 * Modal component for bank accounts preview
 * Allows users to review and import bank account information to chat
 */
export function BankAccountsPreviewModal({ consent }: BaseAnalysisModalProps) {
  const { open, handleClose, handleOpenChange } = useModalState();

  const consentID = consent?.consentID;
  const isDataReady = consent?.isDataReady;

  const importMutation = useImportBankAccountsMutation();

  // Fetch and transform bank accounts data
  const {
    formDefaultValues,
    isLoading,
    fiData,
    isError,
    errorKind,
    errorMessage,
  } = useBankAccountsData(consentID, !!isDataReady);

  const handleSubmit = (modifiedFiData: typeof fiData) => {
    if (!modifiedFiData) return;

    handleClose();

    // Call mutation to import bank accounts to chat
    importMutation.mutate({ data: modifiedFiData });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs"
          disabled={!isDataReady}
        >
          <BarChart3 className="mr-1 h-3 w-3" />
          Analyse
        </Button>
      </DialogTrigger>
      <DialogContent className={workspaceDialogContentClass}>
        {isError ? (
          <>
            <WorkspaceHeader
              icon={CreditCard}
              eyebrow="Import · Bank & Spending"
              title="Bank Accounts"
              srDescription="Review your balances and transaction insights before importing"
            />
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
              <FiDataErrorState
                assetLabel="bank accounts"
                errorKind={errorKind}
                message={errorMessage}
                consent={consent}
                onClose={handleClose}
              />
            </div>
          </>
        ) : (
          <BankAccountsPreviewForm
            defaultValues={formDefaultValues}
            fiData={fiData}
            isLoading={isLoading}
            isImporting={importMutation.isPending}
            onSubmit={handleSubmit}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
