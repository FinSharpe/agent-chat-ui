import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { INTENT_CHIP, type SurfaceIntent } from "./intent";

type IconType = ComponentType<{ className?: string }>;

/**
 * Banded modal header: a tinted icon chip, the Radix DialogTitle/Description
 * (kept for focus labelling + a11y), and an optional right-aligned badge slot.
 * `pr-14` reserves space so the badge never collides with Dialog's close "X".
 *
 * Pair with a `p-0 gap-0` DialogContent so the header/body/footer read as one
 * crisp banded surface instead of three loose stacked blocks.
 */
export function PreviewHeader({
  icon: Icon,
  iconIntent = "brand",
  title,
  description,
  badge,
}: {
  icon: IconType;
  iconIntent?: SurfaceIntent;
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="border-border flex items-start gap-3 border-b px-5 py-4 pr-14">
      <span
        className={cn(
          "mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          INTENT_CHIP[iconIntent],
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <DialogTitle className="text-text-primary truncate text-base font-semibold">
          {title}
        </DialogTitle>
        {description && (
          <DialogDescription className="text-text-tertiary mt-0.5 text-sm">
            {description}
          </DialogDescription>
        )}
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  );
}

/** Scrollable body region with consistent gutters and vertical rhythm. */
export function PreviewBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "scrollbar-thin flex-1 space-y-4 overflow-y-auto px-5 py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Sticky-feeling action bar pinned under the body. `start` (e.g. a running
 * total) sits left, action buttons right.
 */
export function PreviewFooter({
  start,
  children,
  className,
}: {
  start?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border bg-card flex items-center justify-between gap-3 border-t px-5 py-3",
        className,
      )}
    >
      <div className="text-text-tertiary min-w-0 text-sm">{start}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

/** Shared className for a preview DialogContent so all modals frame identically. */
export const previewDialogContentClass =
  "flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0";
