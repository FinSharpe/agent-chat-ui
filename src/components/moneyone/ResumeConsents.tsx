"use client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListedConsent } from "@/lib/moneyone/moneyone.actions";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { ArrowLeft, CheckCircle2, Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useResumeConsentMut,
  useResumePendingMut,
  useRevokeListedConsentMut,
} from "./useResumeConsents";

type Props = {
  consentType: ConsentType;
  mobileNo: string;
  /** PAN — needed to finish a PENDING consent (equity/MF account discovery). */
  pan: string;
  /** Existing consents found for this number + asset type. */
  consents: ListedConsent[];
  /** Re-fetch the list (e.g. after a delete). */
  onRefetch: () => void;
  /** Start a brand-new consent (V3 redirect). */
  onCreateNew: () => void;
  /** Whether a new-consent creation is in flight. */
  isCreating: boolean;
  onBack: () => void;
  onResumed: () => void;
};

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function accountSummary(consent: ListedConsent): string {
  const names = consent.accounts
    .map((a) => a.fipName)
    .filter((n): n is string => Boolean(n));
  if (names.length) return [...new Set(names)].join(", ");
  const count = consent.accounts.length;
  return count
    ? `${count} linked account${count > 1 ? "s" : ""}`
    : "No linked accounts";
}

const consentKey = (c: ListedConsent) => c.consentID ?? c.consentHandle ?? "";

export function ResumeConsents({
  consentType,
  mobileNo,
  pan,
  consents,
  onRefetch,
  onCreateNew,
  isCreating,
  onBack,
  onResumed,
}: Props) {
  const resumeMut = useResumeConsentMut(consentType, mobileNo);
  const pendingMut = useResumePendingMut(consentType, mobileNo, pan);
  const revokeMut = useRevokeListedConsentMut();
  const [toDelete, setToDelete] = useState<ListedConsent | null>(null);

  const isBusy =
    resumeMut.isPending ||
    pendingMut.isPending ||
    revokeMut.isPending ||
    isCreating;
  const busyKey = resumeMut.isPending
    ? consentKey(resumeMut.variables as ListedConsent)
    : pendingMut.isPending
      ? consentKey(pendingMut.variables as ListedConsent)
      : undefined;

  const handleConfirmDelete = () => {
    const consentID = toDelete?.consentID;
    if (!consentID) return;
    revokeMut.mutate(consentID, {
      onSuccess: () => {
        toast.success("Connection removed");
        setToDelete(null);
        onRefetch();
      },
      onError: (error) =>
        toast.error(
          error instanceof Error ? error.message : "Couldn't remove connection",
        ),
    });
  };

  const handleContinue = (consent: ListedConsent) => {
    if (consent.status === "PENDING") {
      // Finish the SAME pending consent in place (redirects to the AA).
      pendingMut.mutate(consent, {
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : "Couldn't resume approval",
          ),
      });
      return;
    }
    resumeMut.mutate(consent, {
      onSuccess: () => {
        toast.success("Connection resumed");
        onResumed();
      },
      onError: (error) =>
        toast.error(
          error instanceof Error ? error.message : "Couldn't resume connection",
        ),
    });
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        disabled={isBusy}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back
      </button>

      <p className="text-sm text-muted-foreground">
        {consents.length > 0
          ? "We found existing connections for "
          : "No existing connections for "}
        <span className="font-medium text-foreground">+91 {mobileNo}</span>
      </p>

      {consents.length > 0 && (
        <ul className="space-y-2">
          {consents.map((consent) => {
            const isPending = consent.status === "PENDING";
            const key = consentKey(consent);
            return (
              <li
                key={key}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isPending ? (
                      <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                    )}
                    <span className="truncate text-sm font-medium">
                      {isPending ? "Approval not completed" : accountSummary(consent)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {isPending
                      ? `Started ${formatDate(consent.consentCreationData)} · needs PAN to finish`
                      : `Connected ${formatDate(consent.consentCreationData)} · valid till ${formatDate(consent.consentExpiry)}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    variant={isPending ? "outline" : "default"}
                    onClick={() => handleContinue(consent)}
                    disabled={isBusy}
                  >
                    {busyKey === key ? (
                      <>
                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                        {isPending ? "Opening…" : "Resuming…"}
                      </>
                    ) : isPending ? (
                      "Finish setup"
                    ) : (
                      "Continue"
                    )}
                  </Button>
                  {/* Delete only available when there's a consentID to revoke. */}
                  {consent.consentID && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setToDelete(consent)}
                      disabled={isBusy}
                      className="p-1.5 text-red-500 hover:text-red-600"
                      title="Remove connection"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Button
        type="button"
        variant={consents.length > 0 ? "outline" : "default"}
        className="w-full"
        onClick={onCreateNew}
        disabled={isBusy}
      >
        {isCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating…
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Create a new connection
          </>
        )}
      </Button>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Remove connection?"
        description="This revokes the consent on MoneyOne and stops data sharing through the Account Aggregator. This can't be undone — you'll need to reconnect to import again."
        confirmLabel="Remove"
        destructive
        confirming={revokeMut.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
