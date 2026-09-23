"use client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AlertTriangle, Check, Loader2, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useConsentReturn } from "../../hooks/useConsentReturn";

const STEPS = [
  "Consent approved",
  "Contacting your providers",
  "Preparing your portfolio",
];

/**
 * What the user sees on return from OneMoney while the first data pull runs.
 *
 * Mounted on the Import page: `useConsentReturn` only opens it when the AA
 * return params are actually present, so it is inert on a normal visit. Copy
 * and the three-step ladder come from finsharpe-mobile's `FetchProgressSheet`.
 *
 * A journey started from a chat's connect card carries that thread; once the
 * consent has settled either way the modal offers the way back, as mobile's
 * pushed consent screen does by popping.
 */
export function FetchingConsentModal() {
  const router = useRouter();
  const { phase, step, error, returnTo, dismiss } = useConsentReturn();
  const open = phase !== "idle";

  const backToChat = returnTo
    ? () => {
        dismiss();
        router.push(returnTo);
      }
    : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent className="rounded-card font-funnel border-0 bg-white p-7 shadow-[0_24px_60px_rgba(10,31,77,0.28)] sm:max-w-sm dark:bg-[#0C1524]">
        {phase === "rejected" || phase === "failed" ? (
          <>
            <DialogTitle className="text-forest-deep text-center text-[15px] font-medium dark:text-white">
              Consent not completed
            </DialogTitle>
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-[#3A2E17] dark:text-amber-400">
                <AlertTriangle size={22} />
              </span>
              <p className="text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                {error ??
                  "The Account Aggregator reported that the request was rejected or timed out. Nothing was shared with FinSharpe. You can try again whenever you like."}
              </p>
              <button
                type="button"
                onClick={dismiss}
                className="bg-brand-gradient mt-1 h-10 w-full rounded-full text-[11px] font-medium tracking-[0.06em] text-white uppercase hover:brightness-110"
              >
                Close
              </button>
              {backToChat && (
                <button
                  type="button"
                  onClick={backToChat}
                  className="hover-tint text-forest-deep h-10 w-full rounded-full border border-slate-100 text-[11px] font-medium dark:border-slate-800 dark:text-white"
                >
                  Back to your chat
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <DialogTitle className="text-forest-deep text-center text-[15px] font-medium dark:text-white">
              {phase === "linked" ? "Your data is in" : "Fetching your holdings"}
            </DialogTitle>

            <ol className="space-y-2.5">
              {STEPS.map((label, i) => {
                const index = i + 1;
                const done = phase === "linked" || index < step;
                const active = index === step && phase !== "linked";
                return (
                  <li key={label} className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        done
                          ? "bg-[#97edcc]/30 text-[#0A9E6E] dark:bg-[#1B3A2E] dark:text-[#6EE7B7]"
                          : active
                            ? "bg-[#063BAA]/8 text-[#063BAA] dark:bg-[#22335C] dark:text-[#8FB4FF]"
                            : "bg-slate-100 text-slate-400 dark:bg-white/10",
                      )}
                    >
                      {done ? (
                        <Check size={12} />
                      ) : active ? (
                        <Loader2
                          size={12}
                          className="animate-spin motion-reduce:animate-none"
                        />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-[12px]",
                        done || active
                          ? "text-forest-deep dark:text-white"
                          : "text-slate-400",
                      )}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ol>

            <p className="text-[10.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              {phase === "linked" && error
                ? "Connected, but your providers have not sent the data yet. Use Sync on the connection in a minute."
                : "This can take up to two minutes. You can keep using the app; we will finish in the background."}
            </p>

            {phase === "linked" && backToChat && (
              <button
                type="button"
                onClick={backToChat}
                className="bg-brand-gradient flex h-10 w-full items-center justify-center gap-2 rounded-full text-[11px] font-medium tracking-[0.06em] text-white uppercase hover:brightness-110"
              >
                <MessageSquare size={13} />
                Back to your chat
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="hover-tint text-forest-deep h-10 w-full rounded-full border border-slate-100 text-[11px] font-medium dark:border-slate-800 dark:text-white"
            >
              {phase === "linked" ? "View portfolio" : "Do this in the background"}
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
