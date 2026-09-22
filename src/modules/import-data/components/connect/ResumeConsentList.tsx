"use client";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import type { DiscoveredConsent } from "../../types/aa";
import { shortDate } from "../../utils/aa-captions";

/**
 * Consents this mobile number already has at the Account Aggregator.
 *
 * ACTIVE ones link straight through `resolve` with no browser round-trip;
 * PENDING ones reopen the SAME approval on OneMoney via their consentHandle,
 * so a half-finished journey is finished rather than duplicated.
 */
export function ResumeConsentList({
  consents,
  busy,
  onResume,
  onCreateNew,
}: {
  consents: DiscoveredConsent[];
  busy: boolean;
  onResume: (consent: DiscoveredConsent) => void;
  onCreateNew: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        You already have {consents.length === 1 ? "a connection" : "connections"}{" "}
        for this number. Continue with one of them, or start a fresh consent.
      </p>

      <ul className="space-y-2">
        {consents.map((consent, i) => {
          const active = consent.status === "ACTIVE";
          const accounts = consent.accounts ?? [];
          return (
            <li key={consent.consentID ?? consent.consentHandle ?? i}>
              <button
                type="button"
                disabled={busy}
                onClick={() => onResume(consent)}
                className="hover-tint flex w-full items-center gap-3 rounded-nested border border-slate-100 px-3 py-3 text-left transition-colors disabled:opacity-50 dark:border-slate-800"
              >
                <span
                  className={
                    active
                      ? "text-[#0A9E6E]"
                      : "text-amber-600 dark:text-amber-400"
                  }
                >
                  {active ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-forest-deep block text-[12px] font-medium dark:text-white">
                    {active ? "Approved connection" : "Approval not finished"}
                  </span>
                  <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">
                    {accounts.length > 0
                      ? accounts
                          .map(
                            (a) =>
                              a.fipName ?? a.maskedAccountNumber ?? a.fiType,
                          )
                          .filter(Boolean)
                          .join(" · ")
                      : consent.consentExpiry
                        ? `Valid till ${shortDate(consent.consentExpiry)}`
                        : "Continue on the OneMoney page"}
                  </span>
                </span>
                <span className="text-[10px] font-semibold text-[#063BAA] dark:text-[#8FB4FF]">
                  {active ? "Use this" : "Finish"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onCreateNew}
        disabled={busy}
        className="bg-brand-gradient flex w-full items-center justify-center gap-2 rounded-full py-3 text-xs font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-98 disabled:opacity-60"
      >
        {busy && (
          <Loader2 size={14} className="animate-spin motion-reduce:animate-none" />
        )}
        Connect a new account
      </button>
    </div>
  );
}
