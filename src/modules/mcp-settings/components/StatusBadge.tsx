import { cn } from "@/lib/utils";
import type { DisplayStatus } from "../utils/grant-display";

interface StatusConfig {
  label: string;
  className: string;
}

// Reference status pills: small uppercase text on a soft tone. Mint means
// usable, amber waiting on an admin, blue scheduled, rose refused/ended by
// an admin, and plain navy tint simply over.
const STATUS_MAP: Record<DisplayStatus, StatusConfig> = {
  active: {
    label: "Active",
    className: "bg-[#97edcc]/25 text-[#0A9E6E]",
  },
  pending: {
    label: "Pending",
    className:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/12 dark:text-amber-400",
  },
  queued: {
    label: "Queued",
    className: "bg-[#063BAA]/8 text-[#063BAA]",
  },
  expired: {
    label: "Expired",
    className: "bg-slate-100 text-slate-500",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-rose-50 text-rose-600 dark:bg-rose-500/12 dark:text-rose-400",
  },
  revoked: {
    label: "Revoked",
    className:
      "bg-rose-50 text-rose-600 dark:bg-rose-500/12 dark:text-rose-400",
  },
};

interface StatusBadgeProps {
  displayStatus: DisplayStatus;
  className?: string;
}

export function StatusBadge({ displayStatus, className }: StatusBadgeProps) {
  const config = STATUS_MAP[displayStatus];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[9px] font-medium tracking-wider uppercase",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
