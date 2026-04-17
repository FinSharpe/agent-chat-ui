import type { MCPDeviceResponse } from "@/api/generated/mcp-apis/models";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { Laptop } from "lucide-react";
import { labelFromUserAgent } from "../utils/device-label";

interface DeviceCardProps {
  device: MCPDeviceResponse;
  className?: string;
}

export function DeviceCard({ device, className }: DeviceCardProps) {
  const label = device.label || labelFromUserAgent(device.user_agent);
  const isRevoked = Boolean(device.revoked_at);
  const lastSeenLabel = device.last_seen_at
    ? formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })
    : "Never used";
  const expiresLabel = device.expires_at
    ? format(new Date(device.expires_at), "MMM d, yyyy")
    : null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border-subtle px-4 py-3 transition-colors",
        "hover:border-border-default hover:bg-bg-hover/60",
        isRevoked && "opacity-60",
        className,
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-subtle text-text-secondary">
        <Laptop className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {label}
          {isRevoked && (
            <span className="ml-2 text-xs font-normal text-text-tertiary">
              · revoked
            </span>
          )}
        </p>
        <p className="text-xs text-text-tertiary">
          Last seen {lastSeenLabel}
          {expiresLabel && ` · expires ${expiresLabel}`}
        </p>
      </div>
    </div>
  );
}
