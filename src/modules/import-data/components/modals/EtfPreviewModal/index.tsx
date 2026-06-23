/**
 * ETF Preview Modal - Container Component
 * Handles modal state, data fetching, and submission for ETF holdings
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
import { BarChart3, TrendingUp } from "lucide-react";
import { EtfPreviewForm } from "./EtfPreviewForm";
import { useEtfData } from "./hooks/useEtfData";
import { useImportEtfMutation } from "./hooks/useImportEtfMutation";

/**
 * Modal component for ETF holdings preview
 * Allows users to review, edit quantities, and import ETF holdings to chat
 */
export function EtfPreviewModal({ consent }: BaseAnalysisModalProps) {
  const { open, handleClose, handleOpenChange } = useModalState();

  const consentID = consent?.consentID;
  const isDataReady = consent?.isDataReady;

  const importMutation = useImportEtfMutation();

  // Fetch and transform ETF data
  const {
    formDefaultValues,
    isLoading,
    fiData,
    currentValue,
    isError,
    errorKind,
    errorMessage,
  } = useEtfData(consentID, !!isDataReady);

  const handleSubmit = (modifiedFiData: typeof fiData) => {
    if (!modifiedFiData) return;

    handleClose();

    // Call mutation to import ETFs to chat
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
            <TrendingUp className="h-5 w-5 text-blue-600" />
            ETF Holdings Preview
          </DialogTitle>
          <DialogDescription>
            Review, edit quantities, or add new ETF holdings before analysis
          </DialogDescription>
        </DialogHeader>

        {isError ? (
          <FiDataErrorState
            assetLabel="ETF holdings"
            errorKind={errorKind}
            message={errorMessage}
            consent={consent}
            onClose={handleClose}
          />
        ) : (
          <EtfPreviewForm
            defaultValues={formDefaultValues}
            fiData={fiData}
            isLoading={isLoading}
            isImporting={importMutation.isPending}
            currentValue={currentValue}
            onSubmit={handleSubmit}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
