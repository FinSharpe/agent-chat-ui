"use client";
import { useCreateConsentAndRedirectMut } from "./useCreateConsentAndRedirectMut";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useImportHoldingsContext } from "./import-holdings.context";
import { ResumeConsents } from "./ResumeConsents";
import { useListConsentsMut } from "./useResumeConsents";

type Props = {
  open: boolean;
  onClose: () => void;
};

const CONSENT_LABEL: Record<ConsentType, string> = {
  [ConsentType.EQUITIES]: "Equity Holdings",
  [ConsentType.MUTUAL_FUNDS]: "Mutual Fund Holdings",
  [ConsentType.ETF]: "ETF Holdings",
  [ConsentType.BANK_ACCOUNTS]: "Bank Accounts",
  [ConsentType.SIP]: "SIP Accounts",
};

const FIELD_LABEL =
  "block text-[10px] font-medium tracking-wider text-slate-400 uppercase";
const FIELD =
  "text-forest-deep w-full rounded-full bg-[#EDF3FF]/45 py-3 text-[12px] outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#063BAA]/20 dark:bg-slate-800/40 dark:text-white";

export default function CreateConsentModel({ open, onClose }: Props) {
  const { consentType } = useImportHoldingsContext();
  const createConsentAndRedirectMut = useCreateConsentAndRedirectMut();
  const listMut = useListConsentsMut(consentType);
  const [mobile, setMobile] = useState("");
  const [pan, setPan] = useState("");
  const [view, setView] = useState<"form" | "resume">("form");

  const createNew = () =>
    createConsentAndRedirectMut.mutate({ number: mobile, pan });

  // One smart action: check for existing connections first. If any are found,
  // show them so the user can continue/finish/remove (or still create new).
  // If none exist, go straight to creating a new consent.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mobile.length !== 10) {
      toast.error("Enter your 10-digit mobile number");
      return;
    }
    if (pan.trim().length !== 10) {
      toast.error("Enter your 10-character PAN");
      return;
    }

    let existing;
    try {
      existing = await listMut.mutateAsync(mobile);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't check existing connections",
      );
      return;
    }

    if (existing.length > 0) {
      setView("resume");
    } else {
      createNew();
    }
  };

  // Reset back to the form whenever the modal is closed
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setView("form");
      onClose();
    }
  };

  const isChecking = listMut.isPending;
  const isCreating = createConsentAndRedirectMut.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent
        showCloseButton={false}
        className="font-funnel text-forest-deep gap-0 overflow-hidden rounded-card border-0 bg-white p-0 shadow-[0_24px_60px_rgba(10,31,77,0.28)] sm:max-w-[420px] dark:bg-[#0C1524] dark:text-white"
      >
        <div className="flex h-[56px] shrink-0 items-center justify-between border-b border-slate-50 px-5 dark:border-slate-800/40">
          <div className="flex min-w-0 flex-col">
            <DialogTitle className="text-xs font-medium tracking-wider text-[#063BAA] uppercase dark:text-[#8FB4FF]">
              {view === "resume" ? "Your connections" : "Connect Account"}
            </DialogTitle>
            <DialogDescription className="mt-0.5 truncate text-[9.5px] leading-none font-medium text-slate-400">
              {CONSENT_LABEL[consentType]} · RBI Account Aggregator
            </DialogDescription>
          </div>
          <DialogClose
            aria-label="Close"
            className="hover-tint flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-100 text-slate-400 transition-colors dark:border-slate-800"
          >
            <X size={16} />
          </DialogClose>
        </div>

        {view === "resume" ? (
          <div className="max-h-[70vh] overflow-y-auto p-5">
            <ResumeConsents
              consentType={consentType}
              mobileNo={mobile}
              pan={pan}
              consents={listMut.data ?? []}
              onRefetch={() => listMut.mutate(mobile)}
              onCreateNew={createNew}
              isCreating={isCreating}
              onBack={() => setView("form")}
              onResumed={onClose}
            />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="max-h-[70vh] space-y-5 overflow-y-auto px-8 pt-6 pb-8"
          >
            <div className="space-y-2">
              <label
                htmlFor="number"
                className={FIELD_LABEL}
              >
                Mobile Number
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[12px] text-slate-400">
                  +91
                </span>
                <input
                  id="number"
                  name="number"
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
              <label
                htmlFor="pan"
                className={FIELD_LABEL}
              >
                PAN
              </label>
              <input
                id="pan"
                name="pan"
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
              <ShieldCheck
                size={13}
                className="mt-0.5 shrink-0 text-[#0A9E6E]"
              />
              Read-only access through the RBI-approved Account Aggregator
              framework. We never store your login credentials.
            </p>

            <button
              type="submit"
              disabled={isChecking || isCreating}
              className="bg-brand-gradient flex w-full items-center justify-center gap-2 rounded-full py-3 text-xs font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-98 disabled:opacity-60"
            >
              {(isChecking || isCreating) && (
                <Loader2
                  size={14}
                  className="animate-spin motion-reduce:animate-none"
                />
              )}
              {isChecking ? "Checking…" : isCreating ? "Connecting…" : "Continue"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
