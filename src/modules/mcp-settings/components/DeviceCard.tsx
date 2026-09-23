import type { MCPDeviceResponse } from "@/api/generated/mcp-apis/models";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { Laptop } from "lucide-react";
import { labelFromUserAgent } from "../utils/device-label";

interface DeviceCardProps {
  device: MCPDeviceResponse;
  className?: string;
}

/** One connected client as a hairline row. */
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
        "flex items-center gap-3.5 border-b border-slate-50 py-3.5 last:border-b-0",
        isRevoked && "opacity-60",
        className,
      )}
    >
      <div className="rounded-tile tone-navy flex h-9 w-9 shrink-0 items-center justify-center">
        <Laptop size={15} />
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-xs font-medium text-[#0A1F4D]">
          {label}
          {isRevoked && (
            <span className="ml-1.5 text-[10px] font-normal text-slate-400">
              · revoked
            </span>
          )}
        </p>
        <p className="text-[10px] text-slate-400">
          Last seen {lastSeenLabel}
          {expiresLabel && ` · expires ${expiresLabel}`}
        </p>
      </div>
    </div>
  );
}
