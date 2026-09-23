import type { MCPDeviceResponse } from "@/api/generated/mcp-apis/models";
import { cn } from "@/lib/utils";
import { Laptop } from "lucide-react";
import { DeviceCard } from "./DeviceCard";
import { EmptyRows, RowSkeletons, SectionHeading } from "./McpKit";

interface DevicesListProps {
  devices: MCPDeviceResponse[] | undefined;
  isLoading?: boolean;
  className?: string;
}

export function DevicesList({
  devices,
  isLoading,
  className,
}: DevicesListProps) {
  const sorted = devices
    ? [...devices].sort((a, b) => {
        const at = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
        const bt = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
        return bt - at;
      })
    : [];

  return (
    <section className={cn("space-y-3", className)}>
      <SectionHeading
        title="Connected Devices"
        sub="Clients that have authenticated with your FinSharpe account via MCP."
      />

      <div className="glass-card rounded-card p-5">
        {isLoading ? (
          <RowSkeletons count={2} />
        ) : sorted.length === 0 ? (
          <EmptyRows
            icon={<Laptop size={17} />}
            title="No devices connected yet"
            sub="Follow the setup steps above to connect from Claude Desktop."
          />
        ) : (
          sorted.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
            />
          ))
        )}
      </div>
    </section>
  );
}
