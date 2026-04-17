import { cn } from "@/lib/utils";
import type { MCPGrantResponse } from "@/api/generated/mcp-apis/models";
import { differenceInDays, format } from "date-fns";
import { ShieldCheck, Calendar, Timer } from "lucide-react";

interface ActiveGrantBannerProps {
  grant: MCPGrantResponse;
  className?: string;
}

export function ActiveGrantBanner({ grant, className }: ActiveGrantBannerProps) {
  const now = new Date();
  const expiresAt = grant.expires_at ? new Date(grant.expires_at) : null;
  const startsAt = grant.starts_at ? new Date(grant.starts_at) : null;
  const daysLeft = expiresAt ? differenceInDays(expiresAt, now) : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-brand-border-via",
        "bg-gradient-to-br from-brand-gradient-from via-brand-gradient-via to-brand-gradient-to",
        "p-6 shadow-sm",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-brand-teal/15 blur-3xl"
      />

      <div className="relative flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-teal/15 ring-1 ring-brand-teal/40">
          <ShieldCheck
            className="size-5 text-brand-teal"
            strokeWidth={2.25}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-base font-semibold text-primary-main-dark">
              Active access
            </h3>
            {daysLeft !== null && daysLeft >= 0 && (
              <span className="text-xs font-medium text-primary-main-light">
                {daysLeft === 0
                  ? "Expires today"
                  : `${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-text-secondary">
            Your FinSharpe account can connect to the MCP server from Claude
            Desktop or other compatible clients.
          </p>

          <dl className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <MetaItem
              icon={Timer}
              label="Duration"
              value={`${grant.duration_days} days`}
            />
            {startsAt && (
              <MetaItem
                icon={Calendar}
                label="Started"
                value={format(startsAt, "MMM d, yyyy")}
              />
            )}
            {expiresAt && (
              <MetaItem
                icon={Calendar}
                label="Expires"
                value={format(expiresAt, "MMM d, yyyy")}
              />
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

interface MetaItemProps {
  icon: typeof Timer;
  label: string;
  value: string;
}

function MetaItem({ icon: Icon, label, value }: MetaItemProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3.5 text-text-tertiary" />
      <dt className="text-text-tertiary">{label}</dt>
      <dd className="font-medium text-text-primary">{value}</dd>
    </div>
  );
}
