import type { MCPGrantResponse } from "@/api/generated/mcp-apis/models";
import { cn } from "@/lib/utils";
import { History } from "lucide-react";
import { GrantCard } from "./GrantCard";
import { EmptyRows, RowSkeletons, SectionHeading } from "./McpKit";

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
    <section className={cn("space-y-3", className)}>
      <SectionHeading
        title="Grant History"
        sub="Every access grant you've requested, active and past."
      />

      <div className="glass-card rounded-card p-5">
        {isLoading ? (
          <RowSkeletons count={3} />
        ) : sorted.length === 0 ? (
          <EmptyRows
            icon={<History size={17} />}
            title="No grants yet"
            sub="Submit a request above to get started."
          />
        ) : (
          sorted.map((grant) => (
            <GrantCard
              key={grant.id}
              grant={grant}
            />
          ))
        )}
      </div>
    </section>
  );
}
