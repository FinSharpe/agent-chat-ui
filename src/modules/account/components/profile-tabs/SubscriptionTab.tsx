"use client";

import { Check, Download } from "lucide-react";
import { profileSettings } from "../../constants/placeholderContent";
import { MintBadge } from "../shared/AccountKit";
import { CardLabel } from "./ProfileKit";

export function SubscriptionTab() {
  const s = profileSettings.subscription;
  return (
    <>
      <div className="glass-card rounded-card space-y-3 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-geist text-sm font-medium text-[#0A1F4D]">
              {s.plan}
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {s.price} · {s.billingNote}
            </p>
          </div>
          <MintBadge>{s.status}</MintBadge>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-3">
          <div>
            <p className="text-[10px] tracking-wider text-slate-400 uppercase">
              Next Billing
            </p>
            <p className="mt-0.5 text-xs font-medium text-[#0A1F4D]">
              {s.nextBilling}
            </p>
          </div>
          <div>
            <p className="text-[10px] tracking-wider text-slate-400 uppercase">
              Days Remaining
            </p>
            <p className="mt-0.5 text-xs font-medium text-[#0A1F4D]">
              {s.daysRemaining} days
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="bg-brand-gradient flex-1 rounded-full py-2.5 text-[11px] font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-98">
            Manage Subscription
          </button>
          <button className="flex-1 rounded-full bg-[#DFF9EF] py-2.5 text-[11px] font-medium tracking-wide text-[#0A1F4D] uppercase transition-colors">
            Change Plan
          </button>
        </div>
      </div>

      <div className="glass-card rounded-card space-y-2.5 p-5">
        <CardLabel>Features Included</CardLabel>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {s.features.map((f) => (
            <div
              key={f}
              className="flex items-center gap-1.5 text-[11px] text-[#0A1F4D]"
            >
              <Check
                size={12}
                className="shrink-0 text-[#0A9E6E]"
                strokeWidth={2.5}
              />{" "}
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-card space-y-1 p-5">
        <CardLabel>Recent Billing</CardLabel>
        {s.recentBilling.map((b) => (
          <div
            key={b.date}
            className="flex items-center justify-between border-b border-slate-50 py-2.5 last:border-b-0"
          >
            <div>
              <p className="text-[11px] font-medium text-[#0A1F4D]">{b.plan}</p>
              <p className="text-[10px] text-slate-400">
                {b.date} · {b.amount} · {b.status}
              </p>
            </div>
            <button className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-[#063BAA]">
              <Download size={12} /> Download
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
