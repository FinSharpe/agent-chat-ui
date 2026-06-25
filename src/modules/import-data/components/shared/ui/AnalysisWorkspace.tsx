"use client";
import { Fragment, useState, type ComponentType, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { INTENT_CHIP, type SurfaceIntent } from "./intent";
import { SectionLabel } from "./layout";

type IconType = ComponentType<{ className?: string }>;

/**
 * Sheet-style workspace frame. Overrides shadcn's centered DialogContent
 * (translate + max-w + radius + padding) so the same `<DialogContent>` renders
 * as a slide-in sheet: a right rail at ~60vw on desktop (`lg`+), and a bottom
 * sheet at ~80dvh on smaller screens. The desktop/mobile split is viewport-based
 * on purpose (it's a device decision); the layout *inside* the sheet responds to
 * the sheet's own width via container queries (see `WorkspaceSplit`).
 */
export const workspaceDialogContentClass = cn(
  "flex flex-col gap-0 overflow-hidden p-0 shadow-2xl",
  "max-w-none translate-x-0 translate-y-0 sm:max-w-none",
  "border-border border-0",
  // < lg — bottom sheet (~80dvh), slides up
  "inset-x-0 bottom-0 left-0 top-auto h-[80dvh] max-h-[80dvh] w-full rounded-t-2xl border-t",
  "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
  // lg+ — right rail (~60vw), slides in from the right
  "lg:inset-y-0 lg:bottom-auto lg:left-auto lg:right-0 lg:top-0 lg:h-[100dvh] lg:max-h-[100dvh] lg:w-[60vw] lg:rounded-l-2xl lg:rounded-tr-none lg:border-l lg:border-t-0",
  "lg:data-[state=open]:slide-in-from-right lg:data-[state=closed]:slide-out-to-right",
);

/** A single figure in the header's live metric strip. */
export type WorkspaceMetric = {
  label: string;
  value: ReactNode;
  /** Small trailing qualifier, e.g. "1Y" or "/mo avg". */
  hint?: string;
  tone?: "default" | "positive" | "negative";
};

const METRIC_TONE = {
  default: "text-text-primary",
  positive: "text-success-fg",
  negative: "text-error-fg",
} as const;

/** Inline, divider-separated KPI row — replaces the old pill + stat-card grid. */
export function MetricStrip({ metrics }: { metrics: WorkspaceMetric[] }) {
  if (metrics.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
      {metrics.map((m, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span
              aria-hidden
              className="bg-border-default h-6 w-px shrink-0 sm:h-7"
            />
          )}
          <div className="flex flex-col">
            <span className="text-text-muted text-[10px] font-medium tracking-wide uppercase sm:text-[11px]">
              {m.label}
            </span>
            <span
              className={cn(
                "text-base leading-tight font-semibold tabular-nums sm:text-lg",
                METRIC_TONE[m.tone ?? "default"],
              )}
            >
              {m.value}
              {m.hint && (
                <span className="text-text-tertiary ml-1 text-xs font-medium">
                  {m.hint}
                </span>
              )}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

/**
 * Command header for the workspace: an uppercase eyebrow with a teal pulse, the
 * title in a tinted icon chip, and the live metric strip. Renders the Radix
 * DialogTitle/Description for focus labelling + a11y.
 */
export function WorkspaceHeader({
  icon: Icon,
  iconIntent = "brand",
  eyebrow,
  title,
  metrics,
  srDescription,
}: {
  icon: IconType;
  iconIntent?: SurfaceIntent;
  eyebrow: string;
  title: ReactNode;
  metrics?: WorkspaceMetric[];
  srDescription?: string;
}) {
  return (
    <header
      className="border-border relative shrink-0 border-b px-4 py-4 pr-12 sm:px-6 sm:py-5 sm:pr-14"
      style={{
        backgroundImage:
          "linear-gradient(180deg, var(--brand-gradient-from), transparent 130%)",
      }}
    >
      <div className="text-text-tertiary flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
        <span
          aria-hidden
          className="bg-brand-teal h-1.5 w-1.5 rounded-full"
          style={{ boxShadow: "0 0 0 3px rgba(66, 212, 163, 0.22)" }}
        />
        {eyebrow}
      </div>

      <div className="mt-2 flex items-center gap-2.5">
        <span
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9",
            INTENT_CHIP[iconIntent],
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
        <DialogTitle className="text-text-primary text-xl font-bold tracking-tight sm:text-2xl">
          {title}
        </DialogTitle>
      </div>

      <DialogDescription className="sr-only">
        {srDescription ?? eyebrow}
      </DialogDescription>

      {metrics && <MetricStrip metrics={metrics} />}

      <span
        aria-hidden
        className="via-brand-teal/50 pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent"
      />
    </header>
  );
}

/**
 * Two-column workspace body: the curate "ledger" (left) and the live analysis
 * "canvas" (right). Breakpoints are CONTAINER-based, not viewport-based: the
 * body is an `@container/workspace`, so the side-by-side split keys off the
 * *sheet's own width*. When the sheet is wide enough (≥720px) both columns sit
 * side by side and scroll independently; when it is narrower (e.g. a 60vw sheet
 * on a smaller desktop, or the mobile bottom sheet) the body becomes a single
 * panel with a segmented `ledger ⇄ canvas` switcher — both panels stay mounted
 * (toggled via CSS) so analysis results, scroll position, and selection survive
 * flipping between tabs.
 */
export function WorkspaceSplit({
  ledger,
  canvas,
  ledgerTab = "Holdings",
  canvasTab = "Analysis",
}: {
  ledger: ReactNode;
  canvas: ReactNode;
  /** Narrow-width tab label for the ledger panel. */
  ledgerTab?: string;
  /** Narrow-width tab label for the analysis panel. */
  canvasTab?: string;
}) {
  const [tab, setTab] = useState<"ledger" | "canvas">("ledger");

  // While narrow only the active panel is shown, as a bounded flex column whose
  // single child stretches to fill (so its inner scroll works). Once the sheet
  // is wide enough the wrapper collapses to `contents` so each column becomes a
  // direct grid child again — restoring the side-by-side split.
  const panelClass = (key: "ledger" | "canvas") =>
    cn(
      "min-h-0 flex-1 flex-col px-4 pb-4 [&>*]:min-h-0 [&>*]:flex-1 @min-[720px]/workspace:contents",
      tab === key ? "flex" : "hidden",
    );

  return (
    <div className="@container/workspace flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col @min-[720px]/workspace:grid @min-[720px]/workspace:grid-cols-[minmax(248px,0.6fr)_minmax(0,1.4fr)] @min-[720px]/workspace:gap-5 @min-[720px]/workspace:overflow-hidden @min-[720px]/workspace:p-6">
        <div
          role="tablist"
          aria-label="Workspace view"
          className="border-border-subtle bg-bg-subtle/60 flex shrink-0 gap-1 border-b p-2 @min-[720px]/workspace:hidden"
        >
          {(
            [
              ["ledger", ledgerTab],
              ["canvas", canvasTab],
            ] as const
          ).map(([key, label]) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(key)}
                className={cn(
                  "flex min-h-[44px] flex-1 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors",
                  active
                    ? "bg-card text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-secondary",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className={panelClass("ledger")}>{ledger}</div>
        <div className={panelClass("canvas")}>{canvas}</div>
      </div>
    </div>
  );
}

/** A titled column inside the workspace body (eyebrow + optional addon + body). */
export function WorkspaceColumn({
  label,
  addon,
  children,
  className,
}: {
  label: ReactNode;
  addon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex min-h-0 flex-col", className)}>
      <div className="mb-2.5 flex min-h-[20px] items-center justify-between gap-2 px-0.5">
        <SectionLabel>{label}</SectionLabel>
        {addon && <div className="flex items-center">{addon}</div>}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}

/** Single centred column for light surfaces (e.g. the SIP registry). */
export function WorkspaceSingle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "scrollbar-thin mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto p-5 lg:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Sticky action bar pinned to the bottom of the workspace. */
export function WorkspaceFooter({
  start,
  children,
}: {
  start?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="border-border bg-bg-subtle/60 flex shrink-0 items-center justify-between gap-3 border-t px-4 py-3 sm:px-6 sm:py-3.5">
      {/* Helper text is contextual — drop it on mobile to give the actions room. */}
      <div className="text-text-tertiary hidden min-w-0 text-sm sm:block">
        {start}
      </div>
      {/* On mobile the primary action (last child) takes the remaining width
          beside a natural-width Cancel; both get 44px tap targets. */}
      <div className="flex w-full items-center justify-end gap-2.5 sm:w-auto [&>button]:min-h-[44px] sm:[&>button]:min-h-9 [&>button:last-child]:flex-1 sm:[&>button:last-child]:flex-none">
        {children}
      </div>
    </div>
  );
}

/**
 * Inviting zero-state for the analysis canvas: a ghosted allocation ring, a
 * prompt, the facets analysis unlocks, and the run CTA.
 */
export function WorkspaceCanvasEmpty({
  title,
  description,
  chips,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  chips?: string[];
  action?: ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-8 text-center">
      <span
        aria-hidden
        className="mb-4 h-32 w-32 rounded-full"
        style={{
          background:
            "conic-gradient(rgba(37,99,235,0.18) 0 33%, rgba(66,212,163,0.18) 33% 60%, rgba(99,102,241,0.14) 60% 100%)",
          WebkitMask:
            "radial-gradient(farthest-side, transparent 60%, #000 61%)",
          mask: "radial-gradient(farthest-side, transparent 60%, #000 61%)",
        }}
      />
      <h3 className="text-text-primary text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-text-tertiary max-w-sm text-sm">{description}</p>
      )}
      {chips && chips.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {chips.map((c, i) => (
            <span
              key={i}
              className="border-border-subtle bg-bg-subtle text-text-secondary rounded-full border px-2.5 py-1 text-[11px] font-medium"
            >
              {c}
            </span>
          ))}
        </div>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Centred loading state while the analysis mutation is in flight. */
export function WorkspaceCanvasLoading({
  label = "Analyzing your portfolio…",
  hint,
}: {
  label?: string;
  hint?: string;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
      <Loader2 className="text-primary h-7 w-7 animate-spin" />
      <p className="text-text-secondary text-sm font-medium">{label}</p>
      {hint && <p className="text-text-muted text-xs">{hint}</p>}
    </div>
  );
}
