/**
 * SIP Preview Modal - Container Component
 * Renders its own "Analyse" pill and opens the SIP registry in the reference
 * analysis-popup layout: stat tiles, registry hygiene, the folio list and the
 * (currently gated) performance analytics. Handles modal state, data
 * fetching, and submission.
 */

"use client";
import { AnimatePresence } from "framer-motion";
import { Repeat } from "lucide-react";
import useModalState from "@/hooks/useModalState";
import { BaseAnalysisModalProps } from "@/modules/import-data/types";
import { FiDataErrorState } from "@/modules/import-data/components/shared/FiDataErrorState";
import {
  AnalyseButton,
  CardListSkeleton,
  EmptyState,
  FooterButton,
  ImportOverlay,
  Notice,
  OverlayBody,
  OverlayFooter,
  OverlayHeader,
  StatGrid,
  StatTile,
  StatTileGridSkeleton,
  formatINRShort,
  formatPct,
} from "@/modules/import-data/components/shared/ui";
import { useSipData } from "./hooks/useSipData";
import { useImportSipMutation } from "./hooks/useImportSipMutation";
import { SipHygieneStrip } from "./components/SipHygieneStrip";
import { SipAnalyticsDashboard } from "./components/SipAnalyticsDashboard";
import { SipLockedAnalytics } from "./components/SipLockedAnalytics";
import { SipRegistryList } from "./components/SipRegistryList";

const TITLE = "SIP Accounts";

/**
 * Modal component for SIP accounts preview
 * Allows users to review SIP registrations and import to chat
 */
export function SipPreviewModal({
  consent,
  triggerClassName,
  triggerLabel,
}: BaseAnalysisModalProps) {
  const { open, handleOpen, handleClose } = useModalState();

  const consentID = consent?.consentID;
  const isDataReady = consent?.isDataReady;

  const importMutation = useImportSipMutation();

  const {
    displayData,
    hygiene,
    analytics,
    hasPerformanceData,
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

  const count = displayData.length;
  const houses = hygiene.fundHouses.length;
  const subtitle = isLoading
    ? "Loading registrations…"
    : `${count} registration${count === 1 ? "" : "s"} • ${houses} fund house${houses === 1 ? "" : "s"}`;

  // Tiles lead with performance once the registrar shares it, otherwise the
  // registry/hygiene figures the Profile block gives us today.
  const tiles =
    hasPerformanceData && analytics ? (
      <StatGrid>
        <StatTile
          label="Current Value"
          value={formatINRShort(analytics.totalCurrentValue)}
          hint={`${formatINRShort(analytics.totalInvested)} invested`}
        />
        <StatTile
          label="Returns"
          value={formatPct(analytics.returnsPct)}
          intent={
            analytics.returnsPct === null
              ? "neutral"
              : analytics.returnsPct >= 0
                ? "positive"
                : "negative"
          }
          hint={
            analytics.absoluteReturn !== null
              ? `${formatINRShort(analytics.absoluteReturn, { signed: true })} absolute`
              : "absolute"
          }
        />
        <StatTile
          label="Monthly SIP"
          value={formatINRShort(analytics.monthlyCommitment)}
          hint="total commitment"
        />
      </StatGrid>
    ) : (
      <StatGrid>
        <StatTile
          label="Registrations"
          value={hygiene.registrations}
          hint="active SIP folios"
        />
        <StatTile
          label="KYC"
          value={
            hygiene.kycTotal > 0
              ? `${hygiene.kycCompliant}/${hygiene.kycTotal}`
              : "—"
          }
          intent={
            hygiene.kycTotal > 0 && hygiene.kycCompliant === hygiene.kycTotal
              ? "positive"
              : "warning"
          }
          hint="holders verified"
        />
        <StatTile
          label="Nominee Gap"
          value={hygiene.nomineeGap}
          intent={hygiene.nomineeGap > 0 ? "warning" : "positive"}
          hint="folios without nominee"
        />
      </StatGrid>
    );

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
                  ) : count === 0 ? (
                    <EmptyState
                      icon={Repeat}
                      title="No SIP registrations found"
                      description="There are no active Systematic Investment Plans to preview for this connection."
                      className="py-16"
                    />
                  ) : (
                    <>
                      {tiles}
                      <SipHygieneStrip
                        hygiene={hygiene}
                        showFigures={hasPerformanceData}
                      />
                      <Notice tone="info">
                        SIP registrations show your active Systematic Investment
                        Plans across fund houses, with account identifiers and
                        registrar details fetched via the Account Aggregator
                        framework. Import them so the assistant can factor your
                        recurring commitments into planning.
                      </Notice>
                      <SipRegistryList rows={displayData} />
                      {hasPerformanceData && analytics ? (
                        <SipAnalyticsDashboard analytics={analytics} />
                      ) : (
                        <SipLockedAnalytics />
                      )}
                    </>
                  )}
                </OverlayBody>
                <OverlayFooter>
                  <FooterButton
                    variant="secondary"
                    onClick={handleClose}
                  >
                    Close
                  </FooterButton>
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
