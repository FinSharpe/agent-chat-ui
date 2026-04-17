import type { MCPGrantResponse } from "@/api/generated/mcp-apis/models";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { History } from "lucide-react";
import { GrantCard } from "./GrantCard";

interface GrantsListProps {
  grants: MCPGrantResponse[] | undefined;
  isLoading?: boolean;
  className?: string;
}

export function GrantsList({ grants, isLoading, className }: GrantsListProps) {
  const sorted = grants
    ? [...grants].sort((a, b) => {
        const at = a.requested_at ? new Date(a.requested_at).getTime() : 0;
        const bt = b.requested_at ? new Date(b.requested_at).getTime() : 0;
        return bt - at;
      })
    : [];

  return (
    <Card className={cn("overflow-hidden py-4", className)}>
      <CardHeader>
        <CardTitle className="text-base">Grant history</CardTitle>
        <CardDescription>
          Every access grant you&apos;ve requested, active and past.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
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
            {sorted.map((grant) => (
              <GrantCard key={grant.id} grant={grant} />
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
      <History className="size-6 text-text-tertiary" />
      <p className="text-sm font-medium text-text-secondary">No grants yet</p>
      <p className="text-xs text-text-tertiary">
        Submit a request above to get started.
      </p>
    </div>
  );
}
