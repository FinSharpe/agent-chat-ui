"use client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRevokeConsent, useSyncConsent } from "../../hooks/useAaMutations";
import type { ConsentRecord } from "../../types/aa";
import { consentStatusChip, relativeTime, shortDate } from "../../utils/aa-captions";
import type { ClassPosition, ConsentTrouble } from "../../utils/aa-fold";
import { CLASS_META, CLASS_TONE_CLASS } from "./account-class-meta";

const CHIP_TONE = {
  positive: "bg-[#97edcc]/25 text-[#0A9E6E] dark:bg-[#1B3A2E] dark:text-[#6EE7B7]",
  warning: "bg-amber-50 text-amber-600 dark:bg-[#3A2E17] dark:text-amber-400",
  neutral: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400",
} as const;

/**
 * The `⋮` sheet — one block per consent of a class, with its status, when it
 * last synced, how long it stays valid, and the two actions that fix it.
 * Ported from finsharpe-mobile `_ConnectionManageSheet` (ln 1896-2144).
 *
 * Busy state is tracked per consent id, not per sheet, so on a class with two
 * consents one busy block never disables the other.
 */
export function ConnectionManageSheet({
  position,
  trouble,
  open,
  onOpenChange,
  onRenew,
}: {
  position: ClassPosition;
  trouble: ConsentTrouble;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRenew: () => void;
}) {
  const consents = position.consents;
  const multi = consents.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-card font-funnel max-h-[80vh] overflow-y-auto border-0 bg-white p-5 shadow-[0_24px_60px_rgba(10,31,77,0.28)] sm:max-w-[420px] dark:bg-[#0C1524]"
      >
        <DialogTitle className={multi ? "text-forest-deep text-[16px] font-semibold dark:text-white" : "sr-only"}>
          {multi ? position.label : `Manage ${position.label}`}
        </DialogTitle>
        <DialogDescription
          className={multi ? "-mt-4 text-[10px] font-medium text-slate-500 dark:text-slate-400" : "sr-only"}
        >
          {multi
            ? `${consents.length} connections`
            : "Sync, renew or remove this Account Aggregator connection."}
        </DialogDescription>

        {consents.length === 0 ? (
          <div className="h-[120px]" />
        ) : (
          consents.map((consent, i) => (
            <div key={consent.consentID}>
              {i > 0 && (
                <div className="my-5 h-px bg-slate-50 dark:bg-white/5" />
              )}
              <ConsentBlock
                consent={consent}
                position={position}
                trouble={trouble}
                onRenew={() => {
                  onOpenChange(false);
                  onRenew();
                }}
                onRemoved={() => {
                  // Close only when nothing of this class is left; a second
                  // connection keeps the sheet open on the block that remains.
                  if (consents.length <= 1) onOpenChange(false);
                }}
              />
            </div>
          ))
        )}
      </DialogContent>
    </Dialog>
  );
}

function ConsentBlock({
  consent,
  position,
  trouble,
  onRenew,
  onRemoved,
}: {
  consent: ConsentRecord;
  position: ClassPosition;
  trouble: ConsentTrouble;
  onRenew: () => void;
  onRemoved: () => void;
}) {
  const { icon: Icon, tone } = CLASS_META[position.type];
  const blob = position.blobs.find((b) => b.consentID === consent.consentID);
  const chip = consentStatusChip(consent, trouble, !!blob);
  const expired = chip.label === "Expired";

  const sync = useSyncConsent();
  const revoke = useRevokeConsent();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const busy = sync.isPending || revoke.isPending;

  const label = position.label;

  return (
    <div>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "rounded-nested flex h-11 w-11 shrink-0 items-center justify-center",
            CLASS_TONE_CLASS[tone],
          )}
        >
          <Icon size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-forest-deep text-[15px] leading-snug font-medium dark:text-white">
            {label}
          </p>
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            Via the RBI Account Aggregator
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-[3px] text-[9px] font-semibold tracking-[0.06em] uppercase",
            CHIP_TONE[chip.tone],
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {chip.label}
        </span>
      </div>

      <div className="mt-3 h-px bg-slate-50 dark:bg-white/5" />

      <DetailRow
        label="Last synced"
        value={blob ? relativeTime(blob.fetchedAt) : "Not synced yet"}
      />
      {trouble.dead.has(consent.consentID) ? (
        <DetailRow label="Consent status" value="No longer active" />
      ) : (
        <DetailRow
          label="Consent valid till"
          value={shortDate(consent.consentExpiry)}
        />
      )}

      <div className="mt-3">
        {expired ? (
          <button
            type="button"
            onClick={onRenew}
            disabled={revoke.isPending}
            className="bg-brand-gradient h-11 w-full rounded-full text-[12px] font-medium tracking-[0.06em] text-white uppercase transition-all hover:brightness-110 active:scale-98 disabled:opacity-50"
          >
            Renew connection
          </button>
        ) : (
          <button
            type="button"
            onClick={() => sync.mutate(consent)}
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#063BAA]/8 text-[12px] font-semibold text-[#063BAA] transition-all hover:brightness-95 active:scale-98 disabled:opacity-45 dark:bg-[#22335C] dark:text-[#8FB4FF]"
          >
            {sync.isPending ? (
              <Loader2 size={14} className="animate-spin motion-reduce:animate-none" />
            ) : (
              <>
                <RefreshCw size={13} />
                Sync now
              </>
            )}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Revoke ${label.toLowerCase()}?`}
        description={`This withdraws your ${label.toLowerCase()} consent with the Account Aggregator and removes the data from FinSharpe. Revoking cannot be undone; you can reconnect later.`}
        confirmLabel="Revoke"
        destructive
        onConfirm={async () => {
          await revoke.mutateAsync(consent);
          onRemoved();
        }}
      />

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={busy}
        className="mt-1 flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[12px] font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-45 dark:text-rose-400 dark:hover:bg-rose-500/10"
      >
        {revoke.isPending ? (
          <>
            <Loader2 size={14} className="animate-spin motion-reduce:animate-none" />
            Removing…
          </>
        ) : (
          <>
            <Trash2 size={16} />
            Remove connection
          </>
        )}
      </button>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="text-forest-deep ml-auto text-[11px] font-medium dark:text-white">
        {value}
      </span>
    </div>
  );
}
