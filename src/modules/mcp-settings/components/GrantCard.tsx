import type { MCPGrantResponse } from "@/api/generated/mcp-apis/models";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { KeyRound } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import {
  deriveDisplayStatus,
  type DisplayStatus,
} from "../utils/grant-display";

interface GrantCardProps {
  grant: MCPGrantResponse;
  className?: string;
}

// Icon tile tone follows the badge: usable grants read mint, the rest calm.
const TILE_TONE: Record<DisplayStatus, string> = {
  active: "tone-mint",
  pending: "tone-blue",
  queued: "tone-blue",
  expired: "tone-navy",
  rejected: "tone-navy",
  revoked: "tone-navy",
};

const day = (iso: string) => format(new Date(iso), "MMM d, yyyy");

/** One grant as a hairline row: duration, its dates, and its status. */
export function GrantCard({ grant, className }: GrantCardProps) {
  const displayStatus = deriveDisplayStatus(grant);

  const dates = [
    grant.requested_at && `Requested ${day(grant.requested_at)}`,
    grant.starts_at && `Starts ${day(grant.starts_at)}`,
    grant.expires_at && `Expires ${day(grant.expires_at)}`,
  ].filter(Boolean);

  return (
    <div
      className={cn(
        "flex items-center gap-3.5 border-b border-slate-50 py-3.5 last:border-b-0",
        className,
      )}
    >
      <div
        className={cn(
          "rounded-tile flex h-9 w-9 shrink-0 items-center justify-center",
          TILE_TONE[displayStatus],
        )}
      >
        <KeyRound size={15} />
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-medium text-[#0A1F4D]">
          {grant.duration_days} days access
        </p>
        {dates.length > 0 && (
          <p className="text-[10px] leading-relaxed text-slate-400">
            {dates.join(" · ")}
          </p>
        )}
        {displayStatus === "rejected" && grant.rejection_reason && (
          <p className="text-[10px] text-slate-400 italic">
            &ldquo;{grant.rejection_reason}&rdquo;
          </p>
        )}
      </div>

      <StatusBadge displayStatus={displayStatus} />
    </div>
  );
}
