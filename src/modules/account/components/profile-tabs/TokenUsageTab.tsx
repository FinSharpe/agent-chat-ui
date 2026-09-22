"use client";

import { profileSettings } from "../../constants/placeholderContent";
import { CardLabel, Meter, StatTile, UsageBarChart } from "./ProfileKit";

const fmt = (n: number) => n.toLocaleString("en-US");

function EfficiencyRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${last ? "" : "border-b border-slate-50"}`}
    >
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-xs font-medium text-[#0A1F4D]">{value}</span>
    </div>
  );
}

export function TokenUsageTab() {
  const t = profileSettings.tokenUsage;
  return (
    <>
      <div className="glass-card rounded-card space-y-2 p-5">
        <div className="flex items-center justify-between">
          <CardLabel>Token Consumption</CardLabel>
          <span className="text-[11px] font-medium text-[#063BAA]">
            {t.percent}% used
          </span>
        </div>
        <Meter percent={t.percent} />
        <p className="text-[10px] text-slate-400">
          {fmt(t.used)} / {fmt(t.limit)}
        </p>
      </div>

      <div className="flex gap-3">
        <StatTile
          label="Used"
          value={t.tiles.used}
          accent
        />
        <StatTile
          label="Remaining"
          value={t.tiles.remaining}
        />
        <StatTile
          label="Limit"
          value={t.tiles.limit}
        />
      </div>

      <div className="glass-card rounded-card space-y-3 p-5">
        <CardLabel>Monthly Token Consumption</CardLabel>
        <div className="h-36 w-full">
          <UsageBarChart
            data={t.monthlyConsumption}
            xKey="m"
            fill="#063BAA"
            left={-15}
          />
        </div>
      </div>

      <div className="glass-card rounded-card space-y-2 p-5">
        <CardLabel>Usage Efficiency</CardLabel>
        <EfficiencyRow
          label="Average tokens / query"
          value={`${t.efficiency.avgPerQuery}`}
        />
        <EfficiencyRow
          label="Most efficient"
          value={t.efficiency.mostEfficient}
        />
        <EfficiencyRow
          label={t.efficiency.complex.name}
          value={`${fmt(t.efficiency.complex.tokens)} tokens`}
          last
        />
      </div>

      <div className="glass-card rounded-card flex items-center justify-between p-5">
        <div>
          <p className="text-[11px] font-medium text-[#0A1F4D]">
            Token Renewal
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Refreshes {t.renewal.date}
          </p>
        </div>
        <span className="rounded-full bg-[#063BAA]/8 px-3 py-1.5 text-[10px] font-medium text-[#063BAA]">
          Auto-renewal in {t.renewal.days} days
        </span>
      </div>
    </>
  );
}
