import { cn } from "@/lib/utils";
import type { MCPGrantResponse } from "@/api/generated/mcp-apis/models";
import { differenceInDays, format } from "date-fns";
import { ShieldCheck } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface ActiveGrantBannerProps {
  grant: MCPGrantResponse;
  className?: string;
}

export function ActiveGrantBanner({
  grant,
  className,
}: ActiveGrantBannerProps) {
  const now = new Date();
  const expiresAt = grant.expires_at ? new Date(grant.expires_at) : null;
  const startsAt = grant.starts_at ? new Date(grant.starts_at) : null;
  const daysLeft = expiresAt ? differenceInDays(expiresAt, now) : null;

  const meta: { label: string; value: string }[] = [
    { label: "Duration", value: `${grant.duration_days} days` },
  ];
  if (startsAt)
    meta.push({ label: "Started", value: format(startsAt, "MMM d, yyyy") });
  if (expiresAt)
    meta.push({ label: "Expires", value: format(expiresAt, "MMM d, yyyy") });

  return (
    <div className={cn("glass-card rounded-card space-y-3 p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-tile tone-mint flex h-9 w-9 shrink-0 items-center justify-center">
            <ShieldCheck size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="font-geist text-sm font-medium text-[#0A1F4D]">
              Active access
            </h3>
            {daysLeft !== null && daysLeft >= 0 && (
              <p className="text-[11px] font-medium text-[#063BAA]">
                {daysLeft === 0
                  ? "Expires today"
                  : `${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`}
              </p>
            )}
          </div>
        </div>
        <StatusBadge displayStatus="active" />
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">
        Your FinSharpe account can connect to the MCP server from Claude Desktop
        or other compatible clients.
      </p>

      <dl className="grid grid-cols-3 gap-3 border-t border-slate-50 pt-3">
        {meta.map((m) => (
          <div key={m.label}>
            <dt className="text-[10px] tracking-wider text-slate-400 uppercase">
              {m.label}
            </dt>
            <dd className="mt-0.5 text-xs font-medium text-[#0A1F4D]">
              {m.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
