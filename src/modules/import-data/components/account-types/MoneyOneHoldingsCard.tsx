"use client";
import ImportHoldings from "@/components/moneyone/import-holdings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { revokeConsent } from "@/lib/moneyone/moneyone.actions";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { deleteConsent } from "@/lib/moneyone/moneyone.storage";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useConsentQuery } from "../../hooks/useConsentQuery";
import { FI_DATA_QUERY_KEY, useRefreshFiData } from "../../hooks/useFiData";
import { formatLastUpdated } from "../../utils/date-formatting";
import { BaseAnalysisModalProps } from "../../types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type MoneyOneHoldingsCardProps = {
  consentType: ConsentType;
  icon: React.ElementType;
  title: string;
  description: string;
  /**
   * Analysis modal component to render for this consent type
   * Must accept BaseAnalysisModalProps (consent: ConsentData | null)
   */
  AnalysisModal: React.ComponentType<BaseAnalysisModalProps>;
};

/**
 * Reusable card component for MoneyOne-connected holdings (Equity, Mutual Funds, ETF, etc.)
 * Displays connection status and import button
 * Renders consent-type specific analysis modal via AnalysisModal prop
 */
export function MoneyOneHoldingsCard({
  consentType,
  icon: Icon,
  title,
  description,
  AnalysisModal,
}: MoneyOneHoldingsCardProps) {
  const queryClient = useQueryClient();
  const { data: consent } = useConsentQuery(consentType);
  const { mutate: refreshData, isPending: isRefreshing } = useRefreshFiData();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isExpired = consent?.isExpired;
  const isDataReady = consent?.isDataReady && !isExpired;
  const lastUpdated = formatLastUpdated(consent?.consentCreationData);

  const handleRefresh = () => {
    if (!consent?.consentID) {
      toast.error("Unable to refresh: consent ID not found");
      return;
    }

    refreshData(consent.consentID, {
      onSuccess: () => {
        toast.success(`${title} data refreshed successfully`);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : `Failed to refresh ${title} data`
        );
      },
    });
  };

  const handleDelete = async () => {
    const consentID = consent?.consentID;
    if (!consentID || isDeleting) return;

    setIsDeleting(true);
    // Revoke on MoneyOne first so the AA actually stops sharing data. If revoke
    // fails (and the consent isn't already gone), still remove it locally but
    // warn the user it may still be live on MoneyOne's side.
    const result = await revokeConsent(consentID);

    if ("error" in result && !result.alreadyGone) {
      toast.warning(
        `${title} removed here, but couldn't be revoked on MoneyOne: ${result.error}`,
      );
    } else {
      toast.success(`${title} connection removed`);
    }

    deleteConsent(consentID);
    queryClient.removeQueries({ queryKey: [FI_DATA_QUERY_KEY, consentID] });
    setIsDeleting(false);
    setConfirmOpen(false);
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow border border-gray-200 h-full gap-0">
      <div className="flex items-start gap-3 h-full">
        <div
          className={`p-2 rounded-lg flex-shrink-0 ${
            isExpired ? "bg-amber-50" : isDataReady ? "bg-green-50" : "bg-gray-50"
          }`}
        >
          <Icon
            className={`w-6 h-6 ${
              isExpired
                ? "text-amber-500"
                : isDataReady
                  ? "text-green-500"
                  : "text-gray-600"
            }`}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col h-full">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900 truncate">{title}</h3>
            {isExpired ? (
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            ) : isDataReady ? (
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : null}
          </div>
          <p className="text-sm text-gray-600 break-words">{description}</p>

          {/* Expired Notice */}
          {isExpired && (
            <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
              <AlertTriangle className="w-3 h-3" />
              <span>Connection expired — refresh to reconnect, or remove it.</span>
            </div>
          )}

          {/* Last Updated Info */}
          {isDataReady && lastUpdated && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Updated {lastUpdated}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 mt-auto pt-3">
            {/* Left side - Import/Connect button */}
            <div className="flex items-center gap-2">
              {isExpired && consent ? (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium ${
                      isRefreshing ? "text-blue-600" : "text-amber-600"
                    }`}
                  >
                    {isRefreshing ? "Refreshing..." : "Expired"}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRefresh}
                    disabled={isRefreshing || isDeleting}
                    className="text-xs p-1.5"
                    title="Refresh data"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`}
                    />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmOpen(true)}
                    disabled={isRefreshing || isDeleting}
                    className="text-xs p-1.5 text-red-500 hover:text-red-600"
                    title="Remove connection"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ) : isDataReady && consent ? (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium ${
                      isRefreshing ? "text-blue-600" : "text-green-600"
                    }`}
                  >
                    {isRefreshing ? "Refreshing..." : "Connected"}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRefresh}
                    disabled={isRefreshing || isDeleting}
                    className="text-xs p-1.5"
                    title="Refresh data"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`}
                    />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmOpen(true)}
                    disabled={isRefreshing || isDeleting}
                    className="text-xs p-1.5 text-red-500 hover:text-red-600"
                    title="Remove connection"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ) : (
                <ImportHoldings consentType={consentType} />
              )}
            </div>

            {/* Right side - Analyse button (consent-specific modal) */}
            <AnalysisModal consent={consent} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Remove ${title}?`}
        description="This revokes the consent on MoneyOne and stops data sharing through the Account Aggregator. This can't be undone — you'll need to reconnect to import again."
        confirmLabel="Remove"
        destructive
        confirming={isDeleting}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
