"use client";

import { Check, CreditCard, Download } from "lucide-react";
import { accountBilling } from "../../constants/placeholderContent";
import { ActionRow, MintBadge } from "../shared/AccountKit";

export function BillingTab() {
  const b = accountBilling;
  return (
    <>
      <div className="glass-card rounded-card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard
              size={16}
              className="text-[#063BAA]"
            />
            <span className="font-geist text-sm font-medium text-[#0A1F4D]">
              {b.planName}
            </span>
          </div>
          <MintBadge>{b.status}</MintBadge>
        </div>
        <p className="text-[11px] text-slate-400">
          Active until {b.activeUntil}
        </p>
        <div className="space-y-1.5 border-t border-slate-50 pt-3">
          {b.features.map((f) => (
            <div
              key={f}
              className="flex items-center gap-2 text-[11px] text-[#0A1F4D]"
            >
              <Check
                size={13}
                className="text-[#0A9E6E]"
                strokeWidth={2.5}
              />{" "}
              {f}
            </div>
          ))}
        </div>
        <button className="bg-brand-gradient w-full rounded-full px-6 py-2.5 text-[11px] font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-98">
          Manage Subscription
        </button>
      </div>

      <div className="glass-card rounded-card p-5">
        <ActionRow
          icon={<CreditCard size={15} />}
          label="Payment Method"
          sub={b.card}
          action="Update"
          tone="tone-blue"
        />
        <ActionRow
          icon={<Download size={15} />}
          label="Billing History"
          sub="Invoices & receipts"
          action="View"
          tone="tone-mint"
        />
      </div>
    </>
  );
}
