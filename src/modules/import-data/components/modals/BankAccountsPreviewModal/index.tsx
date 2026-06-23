/**
 * Bank Accounts Preview Modal - Container Component
 * Handles modal state, data fetching, and submission for bank accounts
 */

"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import useModalState from "@/hooks/useModalState";
import { BaseAnalysisModalProps } from "@/modules/import-data/types";
import { FiDataErrorState } from "@/modules/import-data/components/shared/FiDataErrorState";
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
      <DialogContent className="flex max-h-[85vh] !max-w-[min(96vw,80rem)] flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Bank Accounts Preview
          </DialogTitle>
          <DialogDescription>
            Review your bank account information before analysis
          </DialogDescription>
        </DialogHeader>

        {isError ? (
          <FiDataErrorState
            assetLabel="bank accounts"
            errorKind={errorKind}
            message={errorMessage}
            consent={consent}
            onClose={handleClose}
          />
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
