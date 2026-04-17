import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Hourglass,
  ShieldOff,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DisplayStatus } from "../utils/grant-display";

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  className: string;
}

const STATUS_MAP: Record<DisplayStatus, StatusConfig> = {
  active: {
    label: "Active",
    icon: CheckCircle2,
    className: "bg-success-bg text-success-fg border-success-border",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-warning-bg text-warning-fg border-warning-border",
  },
  queued: {
    label: "Queued",
    icon: Hourglass,
    className: "bg-info-bg text-info-foreground border-info-border",
  },
  expired: {
    label: "Expired",
    icon: AlertCircle,
    className: "bg-muted text-muted-foreground border-border",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-error-bg text-error-fg border-error-border",
  },
  revoked: {
    label: "Revoked",
    icon: ShieldOff,
    className: "bg-error-bg text-error-fg border-error-border",
  },
};

interface StatusBadgeProps {
  displayStatus: DisplayStatus;
  className?: string;
}

export function StatusBadge({ displayStatus, className }: StatusBadgeProps) {
  const config = STATUS_MAP[displayStatus];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium tracking-tight",
        config.className,
        className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.25} />
      {config.label}
    </span>
  );
}
