"use client";

import { accountUsage } from "../../constants/placeholderContent";
import { InfoRow, MintBadge } from "../shared/AccountKit";

export function UsageTab() {
  const u = accountUsage;
  return (
    <>
      <div className="flex items-center justify-between px-1">
        <h3 className="font-geist text-sm font-medium text-[#0A1F4D]">
          Usage Analytics
        </h3>
        <MintBadge>Premium</MintBadge>
      </div>
      <div className="glass-card rounded-card p-5">
        <InfoRow
          label="Queries"
          value={`${u.queries.used} / ${u.queries.total}`}
        />
        <InfoRow
          label="Credits Left"
          value={`$${u.creditsLeft.amount} / $${u.creditsLeft.total}`}
        />
        <InfoRow
          label="Tokens Used"
          value={`${u.tokensUsed.count.toLocaleString("en-US")} (${u.tokensUsed.percent}%)`}
        />
        <InfoRow
          label="Total Cost"
          value={`$${u.totalCost.amount} · $${u.totalCost.perQuery}/query`}
        />
        <InfoRow
          label="Avg Tokens / Query"
          value={`${u.avgTokensPerQuery}`}
        />
      </div>
    </>
  );
}
