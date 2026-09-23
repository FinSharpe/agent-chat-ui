"use client";
import {
  createContext,
  useContext,
  type ComponentType,
  type ReactNode,
} from "react";
import { AlertTriangle, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { INTENT_CHIP, type SurfaceIntent } from "./intent";

type IconType = ComponentType<{ size?: number; className?: string }>;

/**
 * Card eyebrow from the reference modals: optional coloured icon + small
 * uppercase grey label, with an optional right-aligned addon (a count, a link).
 */
export function SectionLabel({
  icon: Icon,
  iconClassName = "text-[#063BAA]",
  children,
  addon,
  className,
}: {
  icon?: IconType;
  iconClassName?: string;
  children: ReactNode;
  addon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <div className="flex min-w-0 items-center gap-1.5">
        {Icon && (
          <Icon
            size={13}
            className={cn("shrink-0", iconClassName)}
          />
        )}
        <span className="truncate text-[10px] font-medium tracking-wider text-slate-400 uppercase">
          {children}
        </span>
      </div>
      {addon && (
        <div className="flex shrink-0 items-center text-[10px] font-medium text-slate-400">
          {addon}
        </div>
      )}
    </div>
  );
}

const BarePanelContext = createContext(false);

/**
 * Drops the glass frame from every DataPanel inside it, so the same cards sit
 * as cardless sections under a `divide-y` parent (the Discover strategy
 * detail) — finsharpe-mobile's `framed: false`.
 */
export function BarePanels({ children }: { children: ReactNode }) {
  return (
    <BarePanelContext.Provider value={true}>
      {children}
    </BarePanelContext.Provider>
  );
}

/** A titled glass card — the frame every chart, list and table sits in. */
export function DataPanel({
  title,
  icon,
  iconClassName,
  addon,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  icon?: IconType;
  iconClassName?: string;
  addon?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const bare = useContext(BarePanelContext);
  return (
    <section
      className={cn(
        "min-w-0 space-y-3",
        bare ? "py-5" : "glass-card rounded-card p-5",
        className,
      )}
    >
      {(title || addon) && (
        <SectionLabel
          icon={icon}
          iconClassName={iconClassName}
          addon={addon}
        >
          {title}
        </SectionLabel>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/**
 * Centred empty / error state: a tinted round icon, a title and a short hint,
 * plus room for a call to action (the reference FD analysis empty state).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  intent = "brand",
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
        "flex flex-col items-center justify-center gap-3 p-8 text-center",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full",
            INTENT_CHIP[intent],
          )}
        >
          <Icon size={24} />
        </div>
      )}
      <p className="text-forest-deep text-[13px] font-medium dark:text-white">
        {title}
      </p>
      {description && (
        <p className="max-w-[300px] text-[11px] leading-relaxed text-slate-400">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

const NOTICE_TONE = {
  success: "bg-emerald-50 text-[#0A9E6E] dark:bg-emerald-500/10",
  warning:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  info: "bg-[#063BAA]/5 text-[#063BAA] dark:bg-blue-500/10 dark:text-[#8FB4FF]",
  danger: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
} as const;

/** Tinted one-line banner (e.g. "Savings rate: 32% — healthy"). */
export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: keyof typeof NOTICE_TONE;
  children: ReactNode;
  className?: string;
}) {
  const Icon =
    tone === "success" ? Check : tone === "info" ? Info : AlertTriangle;
  return (
    <div
      className={cn(
        "rounded-nested flex gap-1.5 px-3 py-2.5 text-[10px] leading-relaxed",
        NOTICE_TONE[tone],
        className,
      )}
    >
      <Icon
        size={12}
        strokeWidth={tone === "success" ? 2.5 : 2}
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export type Flag = { text: ReactNode; warn: boolean };

/** Observation list — amber warning triangles and green checks. */
export function FlagList({ flags }: { flags: Flag[] }) {
  return (
    <div className="text-forest-deep space-y-2 text-[11px] dark:text-slate-200">
      {flags.map((f, i) => (
        <div
          key={i}
          className="flex gap-2 leading-relaxed"
        >
          {f.warn ? (
            <AlertTriangle
              size={13}
              className="mt-0.5 shrink-0 text-amber-500"
            />
          ) : (
            <Check
              size={13}
              strokeWidth={2.5}
              className="mt-0.5 shrink-0 text-[#0A9E6E]"
            />
          )}
          <span>{f.text}</span>
        </div>
      ))}
    </div>
  );
}

/** Small neutral pill, optionally led by a warning/check glyph. */
export function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: "warn" | "ok";
}) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-slate-200/20 bg-slate-100 px-2.5 py-1 text-[9.5px] font-medium text-slate-600 shadow-2xs dark:border-slate-700/20 dark:bg-slate-800 dark:text-slate-300">
      {tone === "warn" && (
        <AlertTriangle
          size={10}
          className="shrink-0 text-amber-500"
        />
      )}
      {tone === "ok" && (
        <Check
          size={10}
          className="shrink-0 text-[#0A9E6E]"
        />
      )}
      <span>{children}</span>
    </span>
  );
}

/** Uppercase blue tag chip (sector tags, facets). */
export function TagChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-[#063BAA]/8 px-2 py-0.5 text-[9px] font-medium tracking-wider text-[#063BAA] uppercase">
      {children}
    </span>
  );
}
