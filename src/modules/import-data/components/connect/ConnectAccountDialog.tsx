"use client";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useConnectConsent } from "../../hooks/useConnectConsent";
import type { AaConsentType } from "../../types/aa";
import { CLASS_LABELS } from "../../utils/aa-fold";
import { ResumeConsentList } from "./ResumeConsentList";

const FIELD_LABEL =
  "block text-[10px] font-medium tracking-wider text-slate-400 uppercase";
const FIELD =
  "text-forest-deep w-full rounded-full bg-[#EDF3FF]/45 py-3 text-[12px] outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#063BAA]/20 dark:bg-slate-800/40 dark:text-white";

/**
 * Mobile + PAN, then OneMoney.
 *
 * The backend does the work: `discover` looks for a consent this number already
 * has at the AA so a half-finished approval is resumed rather than stacked, and
 * `create` returns the OneMoney URL. The user never picks a FIP — that happens
 * on OneMoney's own page, scoped by the backend's per-type FIP config.
 */
export function ConnectAccountDialog({
  type,
  open,
  onOpenChange,
  onLinked,
  returnTo,
}: {
  type: AaConsentType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinked?: () => void;
  /** A path in this app the journey started from; once OneMoney's return is
   *  resolved on Import, the finished modal offers the way back to it. */
  returnTo?: string;
}) {
  const { state, submitForm, launch, connectActive, reset } =
    useConnectConsent(type, { returnTo });
  const [mobile, setMobile] = useState("");
  const [pan, setPan] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mobile.length !== 10) {
      toast.error("Enter your 10-digit mobile number");
      return;
    }
    if (pan.trim().length !== 10) {
      toast.error("Enter your 10-character PAN");
      return;
    }
    void submitForm({ mobileNo: mobile, pan });
  };

  const busy =
    state.phase === "discovering" ||
    state.phase === "launching" ||
    state.phase === "linking";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="font-funnel text-forest-deep rounded-card gap-0 overflow-hidden border-0 bg-white p-0 shadow-[0_24px_60px_rgba(10,31,77,0.28)] sm:max-w-[420px] dark:bg-[#0C1524] dark:text-white"
      >
        <div className="flex h-[56px] shrink-0 items-center justify-between border-b border-slate-50 px-5 dark:border-slate-800/40">
          <div className="flex min-w-0 flex-col">
            <DialogTitle className="text-xs font-medium tracking-wider text-[#063BAA] uppercase dark:text-[#8FB4FF]">
              {state.phase === "resume" ? "Your connections" : "Connect account"}
            </DialogTitle>
            <DialogDescription className="mt-0.5 truncate text-[9.5px] leading-none font-medium text-slate-400">
              {CLASS_LABELS[type]} · RBI Account Aggregator
            </DialogDescription>
          </div>
          <DialogClose
            aria-label="Close"
            className="hover-tint flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-100 text-slate-400 transition-colors dark:border-slate-800"
          >
            <X size={16} />
          </DialogClose>
        </div>

        {state.phase === "resume" ? (
          <div className="max-h-[70vh] overflow-y-auto p-5">
            <ResumeConsentList
              consents={state.discovered}
              busy={busy}
              onResume={(consent) =>
                consent.consentID
                  ? void connectActive(consent, mobile).then((result) => {
                      if (result?.status === "linked") {
                        handleOpenChange(false);
                        onLinked?.();
                      }
                    })
                  : void launch({
                      mobileNo: mobile,
                      pan,
                      consentHandle: consent.consentHandle,
                      accountID: consent.accountID,
                    })
              }
              onCreateNew={() => void launch({ mobileNo: mobile, pan })}
            />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="max-h-[70vh] space-y-5 overflow-y-auto px-8 pt-6 pb-8"
          >
            <div className="space-y-2">
              <label htmlFor="aa-mobile" className={FIELD_LABEL}>
                Mobile number
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[12px] text-slate-400">
                  +91
                </span>
                <input
                  id="aa-mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="Enter mobile number"
                  maxLength={10}
                  required
                  value={mobile}
                  onChange={(e) =>
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  className={`${FIELD} pr-4 pl-12`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="aa-pan" className={FIELD_LABEL}>
                PAN
              </label>
              <input
                id="aa-pan"
                placeholder="Enter PAN"
                maxLength={10}
                required
                autoCapitalize="characters"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                className={`${FIELD} px-4 tracking-wider`}
              />
            </div>

            <p className="flex items-start gap-2 text-[10.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              <ShieldCheck size={13} className="mt-0.5 shrink-0 text-[#0A9E6E]" />
              Read-only access through the RBI-approved Account Aggregator
              framework. We never store your login credentials.
            </p>

            {state.error && (
              <p role="alert" className="text-[11px] text-rose-600 dark:text-rose-400">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="bg-brand-gradient flex w-full items-center justify-center gap-2 rounded-full py-3 text-xs font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-98 disabled:opacity-60"
            >
              {busy && (
                <Loader2 size={14} className="animate-spin motion-reduce:animate-none" />
              )}
              {state.phase === "discovering"
                ? "Checking…"
                : state.phase === "launching"
                  ? "Connecting…"
                  : "Continue"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
