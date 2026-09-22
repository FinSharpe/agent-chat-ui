"use client";
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

  const handleConfirmDelete = async () => {
    const consentID = toDelete?.consentID;
    if (!consentID) return;
    try {
      await revokeMut.mutateAsync(consentID);
      toast.success("Connection removed");
      onRefetch();
      // The dialog closes itself once this resolves (controlled via `toDelete`).
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't remove connection",
      );
      throw error; // keep the dialog open so the user can retry
    }
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
        className="flex items-center gap-1 text-[10px] font-medium text-slate-400 transition-colors hover:text-[#063BAA] disabled:opacity-50"
      >
        <ArrowLeft size={12} />
        Back
      </button>

      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        {consents.length > 0
          ? "We found existing connections for "
          : "No existing connections for "}
        <span className="text-forest-deep font-medium dark:text-white">
          +91 {mobileNo}
        </span>
      </p>

      {consents.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-nested border border-slate-100 dark:divide-slate-800/60 dark:border-slate-800/60">
          {consents.map((consent) => {
            const isPending = consent.status === "PENDING";
            const key = consentKey(consent);
            return (
              <li
                key={key}
                className="flex items-center justify-between gap-3 px-3.5 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isPending ? (
                      <Clock
                        size={13}
                        className="shrink-0 text-amber-500"
                      />
                    ) : (
                      <CheckCircle2
                        size={13}
                        className="shrink-0 text-[#0A9E6E]"
                      />
                    )}
                    <span className="text-forest-deep truncate text-[12px] font-medium dark:text-white">
                      {isPending ? "Approval not completed" : accountSummary(consent)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {isPending
                      ? `Started ${formatDate(consent.consentCreationData)} · needs PAN to finish`
                      : `Connected ${formatDate(consent.consentCreationData)} · valid till ${formatDate(consent.consentExpiry)}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleContinue(consent)}
                    disabled={isBusy}
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-medium transition-all disabled:opacity-50 ${
                      isPending
                        ? "bg-[#DFF9EF] text-[#0A1F4D]"
                        : "bg-brand-gradient text-white hover:brightness-110"
                    }`}
                  >
                    {busyKey === key ? (
                      <>
                        <Loader2
                          size={11}
                          className="animate-spin motion-reduce:animate-none"
                        />
                        {isPending ? "Opening…" : "Resuming…"}
                      </>
                    ) : isPending ? (
                      "Finish setup"
                    ) : (
                      "Continue"
                    )}
                  </button>
                  {/* Delete only available when there's a consentID to revoke. */}
                  {consent.consentID && (
                    <button
                      type="button"
                      onClick={() => setToDelete(consent)}
                      disabled={isBusy}
                      aria-label="Remove connection"
                      title="Remove connection"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onCreateNew}
        disabled={isBusy}
        className={`flex w-full items-center justify-center gap-1.5 rounded-full py-3 text-xs font-medium tracking-wide uppercase transition-all active:scale-98 disabled:opacity-60 ${
          consents.length > 0
            ? "hover-tint text-forest-deep border border-slate-100 dark:border-slate-800 dark:text-white"
            : "bg-brand-gradient text-white hover:brightness-110"
        }`}
      >
        {isCreating ? (
          <>
            <Loader2
              size={14}
              className="animate-spin motion-reduce:animate-none"
            />
            Creating…
          </>
        ) : (
          <>
            <Plus size={14} />
            Create a new connection
          </>
        )}
      </button>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Remove connection?"
        description="This revokes the consent on MoneyOne and stops data sharing through the Account Aggregator. This can't be undone — you'll need to reconnect to import again."
        confirmLabel="Remove"
        destructive
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
