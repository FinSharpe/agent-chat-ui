/**
 * Locked placeholder for SIP performance analytics. Shown while the analytics
 * are gated (no `Summary`/`Transactions` yet). Sets the expectation that the
 * section will fill in automatically — the same view renders the real dashboard
 * the moment the registrar shares the data, with no further work.
 */

"use client";
import { Lock } from "lucide-react";

const FACETS = [
  "Total invested",
  "Current value",
  "XIRR / returns",
  "Monthly commitment",
  "Per-fund split",
  "Installment timeline",
];

export function SipLockedAnalytics() {
  return (
    <div className="border-border from-bg-subtle/40 flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-gradient-to-b to-transparent px-6 py-10 text-center">
      <span
        aria-hidden
        className="mb-2 h-24 w-24 rounded-full"
        style={{
          background:
            "conic-gradient(rgba(37,99,235,0.18) 0 33%, rgba(66,212,163,0.18) 33% 60%, rgba(99,102,241,0.14) 60% 100%)",
          WebkitMask:
            "radial-gradient(farthest-side, transparent 60%, #000 61%)",
          mask: "radial-gradient(farthest-side, transparent 60%, #000 61%)",
        }}
      />

      <span className="border-warning-border bg-warning-bg text-warning-fg inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold">
        <Lock className="h-3 w-3" />
        Awaiting registrar data
      </span>

      <h3 className="text-text-primary text-base font-semibold">
        Performance analytics will unlock automatically
      </h3>
      <p className="text-text-tertiary max-w-md text-sm leading-relaxed">
        Invested amount, current value, returns and installment history appear
        here once your registrar shares the{" "}
        <span className="text-text-secondary font-medium">Summary</span> and{" "}
        <span className="text-text-secondary font-medium">Transaction</span>{" "}
        data for your SIPs. This view is already wired to render them the moment
        they arrive.
      </p>

      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {FACETS.map((facet) => (
          <span
            key={facet}
            className="border-border-subtle bg-bg-subtle text-text-secondary rounded-full border px-2.5 py-1 text-[11px] font-medium"
          >
            {facet}
          </span>
        ))}
      </div>
    </div>
  );
}
