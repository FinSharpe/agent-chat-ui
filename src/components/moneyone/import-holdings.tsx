"use client";
import { ImportHoldingsContextType } from "@/lib/moneyone/moneyone.types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CreateConsentModel from "./CreateConsentModel";
import { ImportHoldingsProvider } from "./import-holdings.context";
import { useCheckConsentMut } from "./useCheckConsentMut";

type Props = Omit<
  ImportHoldingsContextType,
  "showCreateConsentModal" | "setShowCreateConsentModal"
> & {
  /** Button text — "Connect" by default, "Reconnect" for an expired link. */
  label?: string;
  /** Reports the consent check in flight, so a row can say "Connecting…". */
  onPendingChange?: (pending: boolean) => void;
};

/**
 * The Account Aggregator "Connect" pill: checks for an existing consent, then
 * opens the mobile + PAN form that creates one and redirects to the AA.
 */
export default function ImportHoldings({
  consentType,
  label = "Connect",
  onPendingChange,
}: Props) {
  const [showCreateConsentModal, setShowCreateConsentModal] = useState(false);
  const checkConsentMut = useCheckConsentMut(consentType);
  const isChecking = checkConsentMut.isPending;

  useEffect(() => {
    onPendingChange?.(isChecking);
  }, [isChecking, onPendingChange]);

  const handleImportClick = () => {
    checkConsentMut.mutate(undefined, {
      onSettled: (data, error) => {
        if (data) {
          setShowCreateConsentModal(false);
        } else if (!error) {
          setShowCreateConsentModal(true);
        }
      },
      onError: (error: any) => {
        if ("error" in error && typeof error.error === "string") {
          toast.error(error.error);
        } else {
          toast.error("Failed to check consent");
        }
      },
    });
  };

  return (
    <ImportHoldingsProvider
      consentType={consentType}
      showCreateConsentModal={showCreateConsentModal}
      setShowCreateConsentModal={setShowCreateConsentModal}
    >
      {isChecking ? (
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
      ) : (
        <button
          type="button"
          onClick={handleImportClick}
          className="bg-brand-gradient shrink-0 rounded-full px-3 py-1.5 text-[10px] font-medium text-white hover:brightness-110"
        >
          {label}
        </button>
      )}
      <CreateConsentModel
        open={showCreateConsentModal}
        onClose={() => setShowCreateConsentModal(false)}
      />
    </ImportHoldingsProvider>
  );
}
