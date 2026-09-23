/**
 * Bank Accounts Preview Modal - Container Component
 * Renders its own "Analyse" pill and opens the reference bank-analysis popup
 * (desktop) / full-screen panel (mobile). Handles modal state, data fetching,
 * and submission.
 */

"use client";
import { AnimatePresence } from "framer-motion";
import { useAnalysisModalState } from "@/modules/import-data/hooks/useAnalysisModalState";
import { BaseAnalysisModalProps } from "@/modules/import-data/types";
import { FiDataErrorState } from "@/modules/import-data/components/shared/FiDataErrorState";
import {
  AnalyseButton,
  ImportOverlay,
  OverlayHeader,
} from "@/modules/import-data/components/shared/ui";
import { BankAccountsPreviewForm } from "./BankAccountsPreviewForm";
import { useBankAccountsData } from "./hooks/useBankAccountsData";
import { useImportBankAccountsMutation } from "./hooks/useImportBankAccountsMutation";

/**
 * Modal component for bank accounts preview
 * Allows users to review and import bank account information to chat
 */
export function BankAccountsPreviewModal({
  consent,
  triggerClassName,
  triggerLabel,
  open: openProp,
  onOpenChange,
}: BaseAnalysisModalProps) {
  const { open, handleOpen, handleClose } = useAnalysisModalState(
    openProp,
    onOpenChange,
  );

  const consentID = consent?.consentID;
  const isDataReady = consent?.isDataReady;

  const importMutation = useImportBankAccountsMutation();

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
    <>
      <AnalyseButton
        onClick={handleOpen}
        disabled={!isDataReady}
        className={triggerClassName}
      >
        {triggerLabel ?? "Analyse"}
      </AnalyseButton>
      <AnimatePresence>
        {open && (
          <ImportOverlay
            onClose={handleClose}
            label="Bank Account Analysis"
          >
            {isError ? (
              <>
                <OverlayHeader
                  title="Bank Account Analysis"
                  subtitle="Review your balances and transaction insights"
                  onClose={handleClose}
                />
                <FiDataErrorState
                  assetLabel="bank accounts"
                  errorKind={errorKind}
                  message={errorMessage}
                  consent={consent}
                  onClose={handleClose}
                />
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
          </ImportOverlay>
        )}
      </AnimatePresence>
    </>
  );
}
