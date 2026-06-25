import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { INTENT_CHIP, type SurfaceIntent } from "./intent";

type IconType = ComponentType<{ className?: string }>;

/**
 * Tiny uppercase section eyebrow used to title a region without the weight of a
 * heading. Optional leading icon and a right-aligned addon (count, action).
 */
export function SectionLabel({
  icon: Icon,
  children,
  addon,
  className,
}: {
  icon?: IconType;
  children: ReactNode;
  addon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {Icon && <Icon className="text-text-tertiary h-3.5 w-3.5" />}
      <span className="text-text-tertiary text-[11px] font-semibold tracking-[0.08em] uppercase">
        {children}
      </span>
      {addon && <div className="ml-auto flex items-center">{addon}</div>}
    </div>
  );
}

/**
 * A bordered, elevated content surface with an optional header strip. The shell
 * every table / chart / list in the preview modals sits inside, so they share
 * one frame, one radius, one hairline.
 */
export function DataPanel({
  title,
  icon: Icon,
  addon,
  children,
  className,
  bodyClassName,
  noPadding = false,
}: {
  title?: ReactNode;
  icon?: IconType;
  addon?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}) {
  return (
    <section
      className={cn(
        "border-border bg-card overflow-hidden rounded-xl border shadow-sm",
        className,
      )}
    >
      {(title || addon) && (
        <header className="border-border-subtle bg-bg-subtle/60 flex items-center gap-2 border-b px-4 py-2.5">
          {Icon && <Icon className="text-text-tertiary h-4 w-4" />}
          {title && (
            <span className="text-text-secondary text-sm font-medium">
              {title}
            </span>
          )}
          {addon && <div className="ml-auto flex items-center">{addon}</div>}
        </header>
      )}
      <div className={cn(noPadding ? "" : "p-4", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

/**
 * Centred empty / zero-data state — a tinted icon chip, a title, and an
 * optional one-line hint, plus room for a call to action. Used in place of the
 * old bare "No holdings found" strings.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  intent = "neutral",
  action,
  className,
}: {
  icon?: IconType;
  title: ReactNode;
  description?: ReactNode;
  intent?: SurfaceIntent;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <span
          className={cn(
            "inline-flex h-12 w-12 items-center justify-center rounded-2xl",
            INTENT_CHIP[intent],
          )}
        >
          <Icon className="h-6 w-6" />
        </span>
      )}
      <div className="space-y-1">
        <p className="text-text-primary text-sm font-medium">{title}</p>
        {description && (
          <p className="text-text-tertiary mx-auto max-w-sm text-sm">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
