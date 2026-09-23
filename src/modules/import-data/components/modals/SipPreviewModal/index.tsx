/**
 * SIP Preview Modal - Container Component
 * Renders its own "Analyse" pill and opens the SIP view (SipAnalysisBody):
 * the SIPs detected in the mutual-funds consent, then the registrar's
 * registrations and their KYC/nominee health. Handles modal state, data
 * fetching, and submission; the header's close button leaves.
 */

"use client";
import { AnimatePresence } from "framer-motion";
import { useAnalysisModalState } from "@/modules/import-data/hooks/useAnalysisModalState";
import { BaseAnalysisModalProps } from "@/modules/import-data/types";
import { FiDataErrorState } from "@/modules/import-data/components/shared/FiDataErrorState";
import {
  formatINRShort,
  AnalyseButton,
  CardListSkeleton,
  FooterButton,
  ImportOverlay,
  OverlayBody,
  OverlayFooter,
  OverlayHeader,
  StatTileGridSkeleton,
} from "@/modules/import-data/components/shared/ui";
import { useSipData } from "./hooks/useSipData";
import { useMfSips } from "./hooks/useMfSips";
import { useImportSipMutation } from "./hooks/useImportSipMutation";
import { SipAnalysisBody } from "./components/SipAnalysisBody";

const TITLE = "SIP Accounts";

/**
 * Modal component for SIP accounts preview
 * Allows users to review SIP registrations and import to chat
 */
export function SipPreviewModal({
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

  const importMutation = useImportSipMutation();

  const {
    displayData,
    hygiene,
    analytics,
    isLoading,
    fiData,
    isError,
    errorKind,
    errorMessage,
  } = useSipData(consentID, !!isDataReady);

  const handleSubmit = () => {
    if (!fiData || fiData.length === 0) return;
    handleClose();
    importMutation.mutate({ data: fiData });
  };

  const mf = useMfSips();
  const count = displayData.length;
  const houses = hygiene.fundHouses.length;
  const subtitle = isLoading
    ? "Loading registrations…"
    : mf.sips.length > 0 && mf.monthlyCount === mf.sips.length
      ? `${formatINRShort(mf.monthlyCommitment)} a month • ${mf.sips.length} SIP${mf.sips.length === 1 ? "" : "s"}`
      : `${count} registration${count === 1 ? "" : "s"} • ${houses} fund house${houses === 1 ? "" : "s"}`;

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
            label={TITLE}
          >
            <OverlayHeader
              title={TITLE}
              subtitle={
                isError ? "Systematic Investment Plan registrations" : subtitle
              }
              onClose={handleClose}
            />
            {isError ? (
              <FiDataErrorState
                assetLabel="SIP registrations"
                errorKind={errorKind}
                message={errorMessage}
                consent={consent}
                onClose={handleClose}
              />
            ) : (
              <>
                <OverlayBody>
                  {isLoading ? (
                    <>
                      <StatTileGridSkeleton />
                      <CardListSkeleton count={3} />
                    </>
                  ) : (
                    <SipAnalysisBody
                      rows={displayData}
                      hygiene={hygiene}
                      registrarAnalytics={analytics}
                      mf={mf}
                    />
                  )}
                </OverlayBody>
                <OverlayFooter>
                  <FooterButton
                    onClick={handleSubmit}
                    disabled={
                      isLoading || count === 0 || importMutation.isPending
                    }
                    busy={importMutation.isPending}
                    busyLabel="Importing…"
                  >
                    Import to Chat
                  </FooterButton>
                </OverlayFooter>
              </>
            )}
          </ImportOverlay>
        )}
      </AnimatePresence>
    </>
  );
}
