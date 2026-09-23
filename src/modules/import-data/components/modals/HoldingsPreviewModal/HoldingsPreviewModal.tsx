"use client";
import { AnimatePresence } from "framer-motion";
import { useAnalysisModalState } from "@/modules/import-data/hooks/useAnalysisModalState";
import { FiDataErrorState } from "@/modules/import-data/components/shared/FiDataErrorState";
import {
  AnalyseButton,
  ImportOverlay,
  OverlayHeader,
} from "@/modules/import-data/components/shared/ui";
import { BaseAnalysisModalProps } from "@/modules/import-data/types";
import { useImportHoldingsMutation } from "../../../hooks/useImportHoldingsMutation";
import { HoldingsPreviewForm } from "./HoldingsPreviewForm";
import { useHoldingsData } from "./hooks/useHoldingsData";
import type { EditableHoldingsConfig } from "./editable-configs";

type HoldingsPreviewModalProps = BaseAnalysisModalProps & {
  /** Per-asset configuration (one of EQUITIES/ETF/MUTUAL_FUNDS configs). */
  config: EditableHoldingsConfig;
};

/**
 * Generic editable-holdings analysis modal shared by Equities, ETF and Mutual
 * Funds. Renders its own "Analyse" pill; opens the reference analysis popup
 * (desktop) / full-screen panel (mobile). Everything asset-specific comes
 * from `config`.
 */
export function HoldingsPreviewModal({
  consent,
  config,
  triggerClassName,
  triggerLabel,
  open: openProp,
  onOpenChange,
}: HoldingsPreviewModalProps) {
  const { open, handleOpen, handleClose } = useAnalysisModalState(
    openProp,
    onOpenChange,
  );

  const consentID = consent?.consentID;
  const isDataReady = consent?.isDataReady;

  const importMutation = useImportHoldingsMutation();

  const {
    formDefaultValues,
    isLoading,
    fiData,
    normalized,
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
            label={config.title}
          >
            {isError ? (
              <>
                <OverlayHeader
                  title={config.title}
                  subtitle={config.description}
                  onClose={handleClose}
                />
                <FiDataErrorState
                  assetLabel={config.assetLabel}
                  errorKind={errorKind}
                  message={errorMessage}
                  consent={consent}
                  onClose={handleClose}
                />
              </>
            ) : (
              <HoldingsPreviewForm
                config={config}
                defaultValues={formDefaultValues}
                fiData={fiData}
                normalized={normalized}
                isLoading={isLoading}
                isImporting={importMutation.isPending}
                currentValue={currentValue}
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
