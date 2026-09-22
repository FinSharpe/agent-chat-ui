"use client";

import { User } from "lucide-react";
import { profileSettings } from "../../constants/placeholderContent";
import { MintBadge } from "../shared/AccountKit";
import { CardLabel, Meter, StatTile, UsageAreaChart } from "./ProfileKit";

const fmt = (n: number) => n.toLocaleString("en-US");

export function OverviewTab({
  name,
  email,
  initials,
}: {
  name: string;
  email: string | null;
  initials: string | null;
}) {
  const ps = profileSettings;
  const o = ps.overview;
  return (
    <>
      <div className="glass-card rounded-card flex items-center gap-4 p-5">
        <div className="bg-brand-gradient font-geist flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-medium text-white">
          {initials ?? <User size={22} />}
        </div>
        <div className="min-w-0">
          {name && (
            <h3 className="font-geist truncate text-sm font-medium text-[#0A1F4D]">
              {name}
            </h3>
          )}
          {email && (
            <p className="truncate text-[11px] text-slate-400">{email}</p>
          )}
          <div className="mt-1 flex items-center gap-2">
            <MintBadge className="px-2 py-0.5">{ps.planBadge}</MintBadge>
            <span className="text-[9px] text-slate-400">{ps.memberSince}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <StatTile
          label="Total Queries"
          value={fmt(o.totalQueries)}
          accent
        />
        <StatTile
          label="Tokens Used"
          value={o.tokensUsed}
        />
      </div>

      <div className="glass-card rounded-card space-y-3 p-5">
        <CardLabel>Monthly Usage Trend</CardLabel>
        <div className="h-36 w-full">
          <UsageAreaChart
            data={o.monthlyTrend}
            xKey="m"
          />
        </div>
      </div>

      <div className="glass-card rounded-card space-y-2 p-5">
        <div className="flex items-center justify-between">
          <CardLabel>December Usage</CardLabel>
          <span className="text-[11px] font-medium text-[#063BAA]">
            {o.december.percent}% used
          </span>
        </div>
        <Meter percent={o.december.percent} />
        <p className="text-[10px] text-slate-400">
          {fmt(o.december.used)} of {fmt(o.december.total)} queries used
        </p>
      </div>
    </>
  );
}
