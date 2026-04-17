import type { MCPDeviceResponse } from "@/api/generated/mcp-apis/models";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Laptop } from "lucide-react";
import { DeviceCard } from "./DeviceCard";

interface DevicesListProps {
  devices: MCPDeviceResponse[] | undefined;
  isLoading?: boolean;
  className?: string;
}

export function DevicesList({ devices, isLoading, className }: DevicesListProps) {
  const sorted = devices
    ? [...devices].sort((a, b) => {
        const at = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
        const bt = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
        return bt - at;
      })
    : [];

  return (
    <Card className={cn("overflow-hidden py-4", className)}>
      <CardHeader>
        <CardTitle className="text-base">Connected devices</CardTitle>
        <CardDescription>
          Clients that have authenticated with your FinSharpe account via MCP.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg bg-bg-subtle"
              />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {sorted.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-default py-10 text-center">
      <Laptop className="size-6 text-text-tertiary" />
      <p className="text-sm font-medium text-text-secondary">
        No devices connected yet
      </p>
      <p className="text-xs text-text-tertiary">
        Follow the setup steps above to connect from Claude Desktop.
      </p>
    </div>
  );
}
