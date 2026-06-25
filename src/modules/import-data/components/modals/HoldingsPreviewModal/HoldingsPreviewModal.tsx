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
import { FiDataErrorState } from "@/modules/import-data/components/shared/FiDataErrorState";
import { BaseAnalysisModalProps } from "@/modules/import-data/types";
import { BarChart3, TrendingUp } from "lucide-react";
import { useImportHoldingsMutation } from "../../../hooks/useImportHoldingsMutation";
import { HoldingsPreviewForm } from "./HoldingsPreviewForm";
import { useHoldingsData } from "./hooks/useHoldingsData";
import type { EditableHoldingsConfig } from "./editable-configs";

type HoldingsPreviewModalProps = BaseAnalysisModalProps & {
  /** Per-asset configuration (one of EQUITIES/ETF/MUTUAL_FUNDS configs). */
  config: EditableHoldingsConfig;
};

/**
 * Generic editable-holdings preview modal shared by Equities, ETF, and Mutual
 * Funds. Handles modal state, data fetching, error state, and submission;
 * everything asset-specific is supplied via `config`.
 */
export function HoldingsPreviewModal({
  consent,
  config,
}: HoldingsPreviewModalProps) {
  const { open, handleClose, handleOpenChange } = useModalState();

  const consentID = consent?.consentID;
  const isDataReady = consent?.isDataReady;

  const importMutation = useImportHoldingsMutation();

  const {
    formDefaultValues,
    isLoading,
    fiData,
    currentValue,
    isError,
    errorKind,
    errorMessage,
  } = useHoldingsData(consentID, config.consentType, !!isDataReady);

  const handleSubmit = (modifiedFiData: typeof fiData) => {
    if (!modifiedFiData) return;

    handleClose();
    importMutation.mutate({
      data: modifiedFiData,
      consentType: config.consentType,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs"
          disabled={!isDataReady}
        >
          <BarChart3 className="w-3 h-3 mr-1" />
          Analyse
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-[min(96vw,80rem)] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        {isError ? (
          <FiDataErrorState
            assetLabel={config.assetLabel}
            errorKind={errorKind}
            message={errorMessage}
            consent={consent}
            onClose={handleClose}
          />
        ) : (
          <HoldingsPreviewForm
            config={config}
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
