/**
 * Shared error state for FI-data preview modals.
 *
 * Renders inside a preview modal when the FI-data fetch fails, instead of a
 * silently empty form/table. The action it offers depends on why the fetch
 * failed (see `FiDataErrorKind`):
 *   - data-missing → "Fetch latest data" (triggers a fresh FI request; the
 *     modal recovers automatically once data arrives)
 *   - consent-dead → "Remove connection" (deletes the consent so the card
 *     falls back to Connect for re-consent)
 *   - transient    → "Try again"
 */
"use client";

import { Button } from "@/components/ui/button";
import { revokeConsent } from "@/lib/moneyone/moneyone.actions";
import { ConsentData, deleteConsent } from "@/lib/moneyone/moneyone.storage";
import { FiDataErrorKind } from "@/lib/moneyone/moneyone.utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CircleSlash,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { FI_DATA_QUERY_KEY, useRefreshFiData } from "../../hooks/useFiData";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, PreviewFooter } from "./ui";

type FiDataErrorStateProps = {
  /** Human-readable asset label, e.g. "equity holdings". */
  assetLabel: string;
  /** Why the fetch failed (drives the offered action). */
  errorKind: FiDataErrorKind | null;
  /** Raw error message from MoneyOne (shown for transient errors). */
  message?: string;
  /** The consent this modal is for (needed for refresh/delete actions). */
  consent?: ConsentData | null;
  /** Close the modal. */
  onClose: () => void;
};

export function FiDataErrorState({
  assetLabel,
  errorKind,
  message,
  consent,
  onClose,
}: FiDataErrorStateProps) {
  const queryClient = useQueryClient();
  const { mutate: refresh, isPending: isRefreshing } = useRefreshFiData();
  const consentID = consent?.consentID;

  // Revoke on MoneyOne first; on failure (and not already gone) still remove
  // locally but warn it may still be live on MoneyOne's side. On success the
  // modal closes (onClose) so the card falls back to Connect for re-consent.
  const { mutateAsync: deleteConnection, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => revokeConsent(id),
    onSuccess: (result, id) => {
      if ("error" in result && !result.alreadyGone) {
        toast.warning(
          `Removed here, but couldn't be revoked on MoneyOne: ${result.error}`,
        );
      } else {
        toast.success("Connection removed");
      }
      deleteConsent(id);
      queryClient.removeQueries({ queryKey: [FI_DATA_QUERY_KEY, id] });
      onClose();
    },
  });

  const handleRefresh = () => {
    if (!consentID) {
      toast.error("Unable to fetch: consent ID not found");
      return;
    }
    // On success, useRefreshFiData writes fresh data into the same query cache
    // key this modal reads — the modal then re-renders into its normal form.
    refresh(consentID, {
      onSuccess: () => toast.success("Latest data fetched"),
      onError: (error) =>
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch data",
        ),
    });
  };

  const handleDelete = async () => {
    if (consentID) await deleteConnection(consentID);
  };

  const isConsentDead = errorKind === "consent-dead";
  const isDataMissing = errorKind === "data-missing";

  const { icon, intent, title, description } = isConsentDead
    ? {
        icon: CircleSlash,
        intent: "negative" as const,
        title: "Connection expired",
        description: `Your consent for these ${assetLabel} is no longer valid (expired or revoked). Remove this connection and reconnect to continue.`,
      }
    : isDataMissing
      ? {
          icon: RefreshCw,
          intent: "info" as const,
          title: "No data to show yet",
          description: `This connection is valid, but there's no ${assetLabel} data available right now — it may not have been fetched yet, or it was cleared after the retention period. Fetch the latest data to continue.`,
        }
      : {
          icon: AlertTriangle,
          intent: "warning" as const,
          title: `Couldn't load your ${assetLabel}`,
          description:
            message ||
            "Something went wrong while fetching your data. Please try again in a moment.",
        };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <EmptyState
        icon={icon}
        intent={intent}
        title={title}
        description={description}
        className="flex-1"
      />

      <PreviewFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isRefreshing || isDeleting}
        >
          Close
        </Button>

        {isConsentDead ? (
          <ConfirmDialog
            title="Remove connection?"
            description="This revokes the consent on MoneyOne and stops data sharing through the Account Aggregator. This can't be undone — you'll need to reconnect to import again."
            confirmLabel="Remove"
            destructive
            onConfirm={handleDelete}
          >
            {(_, setOpen) => (
              <Button
                variant="destructive"
                onClick={() => setOpen(true)}
                disabled={isRefreshing || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing…
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove connection
                  </>
                )}
              </Button>
            )}
          </ConfirmDialog>
        ) : (
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching…
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {isDataMissing ? "Fetch latest data" : "Try again"}
              </>
            )}
          </Button>
        )}
      </PreviewFooter>
    </div>
  );
}
