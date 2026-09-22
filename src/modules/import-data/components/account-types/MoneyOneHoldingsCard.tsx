"use client";
import ImportHoldings from "@/components/moneyone/import-holdings";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { revokeConsent } from "@/lib/moneyone/moneyone.actions";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { deleteConsent } from "@/lib/moneyone/moneyone.storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Trash2, type LucideIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useConsentQuery } from "../../hooks/useConsentQuery";
import { FI_DATA_QUERY_KEY, useRefreshFiData } from "../../hooks/useFiData";
import { BaseAnalysisModalProps } from "../../types";
import { formatLastUpdated } from "../../utils/date-formatting";
import { AccountRow, RowIconButton, type AccountStatusTone } from "./AccountRow";

type MoneyOneHoldingsCardProps = {
  consentType: ConsentType;
  icon: LucideIcon;
  title: string;
  description: string;
  /** Position in the list — picks the icon tile colour. */
  tone?: number;
  /**
   * Analysis modal for this consent type. It renders its own "Analyse"
   * trigger, which the Import page styles as the reference's mint pill.
   */
  AnalysisModal: React.ComponentType<BaseAnalysisModalProps>;
};

/**
 * A Connected Accounts row for an Account Aggregator (MoneyOne) asset type —
 * Equities, Mutual Funds, ETF, Bank, SIP. Not connected → Connect (consent +
 * AA redirect); returning from the AA → Connecting…; connected → Analyse,
 * with refresh / remove on the status line; expired → Reconnect.
 */
export function MoneyOneHoldingsCard({
  consentType,
  icon,
  title,
  description,
  tone = 0,
  AnalysisModal,
}: MoneyOneHoldingsCardProps) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { data: consent } = useConsentQuery(consentType);
  const { mutate: refreshData, isPending: isRefreshing } = useRefreshFiData();
  const [isChecking, setIsChecking] = useState(false);

  // Revoke on MoneyOne first so the AA actually stops sharing data. If revoke
  // fails (and the consent isn't already gone), still remove it locally but
  // warn the user it may still be live on MoneyOne's side.
  const { mutateAsync: deleteConnection, isPending: isDeleting } = useMutation({
    mutationFn: (consentID: string) => revokeConsent(consentID),
    onSuccess: (result, consentID) => {
      if ("error" in result && !result.alreadyGone) {
        toast.warning(
          `${title} removed here, but couldn't be revoked on MoneyOne: ${result.error}`,
        );
      } else {
        toast.success(`${title} connection removed`);
      }
      deleteConsent(consentID);
      queryClient.removeQueries({ queryKey: [FI_DATA_QUERY_KEY, consentID] });
    },
  });

  const isExpired = !!consent?.isExpired;
  const isDataReady = !!consent?.isDataReady && !isExpired;
  const lastUpdated = formatLastUpdated(consent?.consentCreationData);
  // Back from the AA with this type's consent — FetchingFiDataModal is
  // pulling the first data in; the row shows the reference's connecting state.
  const isReturning =
    !!consent &&
    !consent.isDataReady &&
    !isExpired &&
    searchParams.get("consentType") === consentType &&
    !!searchParams.get("consentID");

  const handleRefresh = () => {
    if (!consent?.consentID) {
      toast.error("Unable to refresh: consent ID not found");
      return;
    }
    refreshData(consent.consentID, {
      onSuccess: () => toast.success(`${title} data refreshed successfully`),
      onError: (error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : `Failed to refresh ${title} data`,
        ),
    });
  };

  const handleDelete = async () => {
    if (consent?.consentID) await deleteConnection(consent.consentID);
  };

  const [status, statusTone]: [string, AccountStatusTone] = isRefreshing
    ? ["Refreshing…", "connecting"]
    : isChecking || isReturning
      ? ["Connecting…", "connecting"]
      : isExpired
        ? ["Connection expired", "warning"]
        : isDataReady
          ? [lastUpdated ? `Updated ${lastUpdated}` : "Connected", "connected"]
          : consent
            ? // Consented, but the first data pull never landed (the fetch
              // modal was closed or failed) — refresh retries it.
              ["Awaiting data", "warning"]
            : ["Not connected", "idle"];

  const busy = isRefreshing || isDeleting;
  const statusActions =
    consent && !isReturning ? (
      <>
        <RowIconButton
          label={`Refresh ${title}`}
          onClick={handleRefresh}
          disabled={busy}
        >
          <RefreshCw
            size={11}
            className={isRefreshing ? "animate-spin motion-reduce:animate-none" : ""}
          />
        </RowIconButton>
        <ConfirmDialog
          title={`Remove ${title}?`}
          description="This revokes the consent on MoneyOne and stops data sharing through the Account Aggregator. This can't be undone — you'll need to reconnect to import again."
          confirmLabel="Remove"
          destructive
          onConfirm={handleDelete}
        >
          {(_, setOpen) => (
            <RowIconButton
              label={`Remove ${title} connection`}
              onClick={() => setOpen(true)}
              disabled={busy}
              destructive
            >
              {isDeleting ? (
                <Loader2
                  size={11}
                  className="animate-spin motion-reduce:animate-none"
                />
              ) : (
                <Trash2 size={11} />
              )}
            </RowIconButton>
          )}
        </ConfirmDialog>
      </>
    ) : null;

  const trailing = isReturning ? (
    <span
      role="status"
      aria-label="Connecting"
      className="flex h-8 w-8 shrink-0 items-center justify-center"
    >
      <Loader2
        size={15}
        className="animate-spin text-amber-500 motion-reduce:animate-none"
      />
    </span>
  ) : isDataReady ? (
    // The modal owns its trigger; import.css restyles it as the mint pill.
    <span className="import-slot-analyse shrink-0">
      <AnalysisModal consent={consent} />
    </span>
  ) : (
    <ImportHoldings
      consentType={consentType}
      label={isExpired ? "Reconnect" : "Connect"}
      onPendingChange={setIsChecking}
    />
  );

  return (
    <AccountRow
      icon={icon}
      tone={tone}
      title={title}
      description={description}
      status={status}
      statusTone={statusTone}
      statusActions={statusActions}
      trailing={trailing}
    />
  );
}
