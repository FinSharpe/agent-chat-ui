"use client";

import { profileSettings } from "../../constants/placeholderContent";
import { CardLabel, Meter, StatTile, UsageBarChart } from "./ProfileKit";

export function UsageAnalyticsTab() {
  const u = profileSettings.usageAnalytics;
  return (
    <>
      <div className="flex gap-3">
        <StatTile
          label="Daily Average"
          value={`${u.dailyAverage}`}
          accent
        />
        <StatTile
          label="Peak Day"
          value={`${u.peakDay.value}`}
        />
      </div>

      <div className="glass-card rounded-card space-y-3 p-5">
        <CardLabel>Monthly Query Volume</CardLabel>
        <div className="h-36 w-full">
          <UsageBarChart
            data={u.monthlyQueryVolume}
            xKey="m"
            fill="#063BAA"
          />
        </div>
      </div>

      <div className="glass-card rounded-card space-y-2.5 p-5">
        <CardLabel>Analysis Types</CardLabel>
        {u.analysisTypes.map((a) => (
          <div
            key={a.name}
            className="space-y-1"
          >
            <div className="flex justify-between text-[11px]">
              <span className="font-medium text-[#0A1F4D]">{a.name}</span>
              <span className="text-slate-400">{a.pct}%</span>
            </div>
            <Meter
              percent={a.pct}
              brand={false}
              thin
            />
          </div>
        ))}
      </div>

      <div className="glass-card rounded-card space-y-3 p-5">
        <CardLabel>Last 7 Days Activity</CardLabel>
        <div className="h-28 w-full">
          <UsageBarChart
            data={u.last7Days}
            xKey="d"
            fill="#97edcc"
          />
        </div>
      </div>
    </>
  );
}
