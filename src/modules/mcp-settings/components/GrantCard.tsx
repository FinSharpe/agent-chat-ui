import type { MCPGrantResponse } from "@/api/generated/mcp-apis/models";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { StatusBadge } from "./StatusBadge";
import { deriveDisplayStatus } from "../utils/grant-display";

interface GrantCardProps {
  grant: MCPGrantResponse;
  className?: string;
}

export function GrantCard({ grant, className }: GrantCardProps) {
  const displayStatus = deriveDisplayStatus(grant);

  const requested = grant.requested_at
    ? format(new Date(grant.requested_at), "MMM d, yyyy")
    : null;
  const starts = grant.starts_at
    ? format(new Date(grant.starts_at), "MMM d, yyyy")
    : null;
  const expires = grant.expires_at
    ? format(new Date(grant.expires_at), "MMM d, yyyy")
    : null;

  return (
    <div
      className={cn(
        "group flex flex-col gap-2 rounded-lg border border-border-subtle px-4 py-3 transition-colors",
        "hover:border-border-default hover:bg-bg-hover/60",
        "sm:flex-row sm:items-center sm:gap-4",
        className,
      )}
    >
      <div className="flex items-center gap-3 sm:w-36 sm:shrink-0">
        <StatusBadge displayStatus={displayStatus} />
      </div>

      <dl className="flex flex-1 flex-wrap gap-x-6 gap-y-1 text-xs">
        <Meta label="Duration" value={`${grant.duration_days} days`} />
        {requested && <Meta label="Requested" value={requested} />}
        {starts && <Meta label="Starts" value={starts} />}
        {expires && <Meta label="Expires" value={expires} />}
      </dl>

      {displayStatus === "rejected" && grant.rejection_reason && (
        <p className="text-xs italic text-text-tertiary sm:max-w-xs sm:text-right">
          &ldquo;{grant.rejection_reason}&rdquo;
        </p>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-text-tertiary">{label}</dt>
      <dd className="font-medium text-text-secondary">{value}</dd>
    </div>
  );
}
