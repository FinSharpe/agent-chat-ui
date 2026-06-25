"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import useModalState from "@/hooks/useModalState";
import { FiDataErrorState } from "@/modules/import-data/components/shared/FiDataErrorState";
import {
  WorkspaceHeader,
  workspaceDialogContentClass,
} from "@/modules/import-data/components/shared/ui";
import { BaseAnalysisModalProps } from "@/modules/import-data/types";
import { BarChart3 } from "lucide-react";
import { useImportHoldingsMutation } from "../../../hooks/useImportHoldingsMutation";
import { HoldingsPreviewForm } from "./HoldingsPreviewForm";
import { useHoldingsData } from "./hooks/useHoldingsData";
import type { EditableHoldingsConfig } from "./editable-configs";

type HoldingsPreviewModalProps = BaseAnalysisModalProps & {
  /** Per-asset configuration (one of EQUITIES/ETF/MUTUAL_FUNDS configs). */
  config: EditableHoldingsConfig;
};

/**
 * Generic editable-holdings workspace shared by Equities, ETF, and Mutual
 * Funds. Opens as a full-screen "Analysis Workspace" (ledger + live analysis
 * canvas); everything asset-specific is supplied via `config`.
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
              icon={config.icon}
              eyebrow={config.eyebrow}
              title={config.title}
              srDescription={config.description}
            />
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
              <FiDataErrorState
                assetLabel={config.assetLabel}
                errorKind={errorKind}
                message={errorMessage}
                consent={consent}
                onClose={handleClose}
              />
            </div>
          </>
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
