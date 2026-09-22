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

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

/** Icon-tile colours per failure, in the Import page's tone language. */
const TILE = {
  negative: "bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400",
  info: "bg-[#063BAA]/8 text-[#063BAA] dark:text-[#8FB4FF]",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
} as const;

const PILL =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-[11px] font-medium transition-all active:scale-98 disabled:pointer-events-none disabled:opacity-50";

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

  const { icon: Icon, intent, title, description } = isConsentDead
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
    <div className="font-funnel flex flex-1 flex-col overflow-hidden">
      <div
        role="alert"
        className="flex flex-1 flex-col items-center justify-center gap-3.5 px-6 py-10 text-center"
      >
        <div
          className={`rounded-nested flex h-12 w-12 items-center justify-center ${TILE[intent]}`}
        >
          <Icon size={22} />
        </div>
        <div className="max-w-[360px] space-y-1">
          <p className="text-forest-deep font-geist text-[13px] font-medium dark:text-white">
            {title}
          </p>
          <p className="text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-50 px-5 py-4 dark:border-slate-800/40">
        <button
          type="button"
          onClick={onClose}
          disabled={isRefreshing || isDeleting}
          className={`${PILL} hover-tint text-forest-deep border border-slate-100 dark:border-slate-800 dark:text-white`}
        >
          Close
        </button>

        {isConsentDead ? (
          <ConfirmDialog
            title="Remove connection?"
            description="This revokes the consent on MoneyOne and stops data sharing through the Account Aggregator. This can't be undone — you'll need to reconnect to import again."
            confirmLabel="Remove"
            destructive
            onConfirm={handleDelete}
          >
            {(_, setOpen) => (
              <button
                type="button"
                onClick={() => setOpen(true)}
                disabled={isRefreshing || isDeleting}
                className={`${PILL} bg-rose-500 text-white hover:brightness-110`}
              >
                {isDeleting ? (
                  <>
                    <Loader2
                      size={13}
                      className="animate-spin motion-reduce:animate-none"
                    />
                    Removing…
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    Remove connection
                  </>
                )}
              </button>
            )}
          </ConfirmDialog>
        ) : (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`${PILL} bg-brand-gradient text-white hover:brightness-110`}
          >
            {isRefreshing ? (
              <>
                <Loader2
                  size={13}
                  className="animate-spin motion-reduce:animate-none"
                />
                Fetching…
              </>
            ) : (
              <>
                <RefreshCw size={13} />
                {isDataMissing ? "Fetch latest data" : "Try again"}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
