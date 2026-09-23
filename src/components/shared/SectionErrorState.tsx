"use client";

import React from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";

/**
 * The one inline "we couldn't load this" block, for any list or section whose
 * query can fail (T-10 item 3). Modelled on the Import page's
 * `FiDataErrorState`, but with no MoneyOne knowledge, so every module can use
 * it.
 *
 * The point is to keep **failed** apart from **empty**: a section that renders
 * its empty copy after a failed query tells the visitor "you have nothing",
 * which is a different — and wrong — statement. Render this instead whenever
 * `isError` is set, and keep the empty copy for a query that actually
 * succeeded with no rows.
 *
 * ```tsx
 * if (isError) return <SectionErrorState label="market news" onRetry={refetch} retrying={isFetching} />;
 * if (!items.length) return <EmptyState … />;
 * ```
 */
export interface SectionErrorStateProps {
  /**
   * What could not be loaded, lower-case, as it reads inside a sentence —
   * "your holdings", "market news". Used for the default title and copy.
   */
  label?: string;
  /** Overrides the generated title. */
  title?: string;
  /** Overrides the generated supporting line. */
  description?: string;
  /** Shows a "Try again" button. Usually a react-query `refetch`. */
  onRetry?: () => void;
  /** Disables the button and spins it while the retry is in flight. */
  retrying?: boolean;
  /** Row-sized variant for tight places (inside a card, a narrow column). */
  compact?: boolean;
  className?: string;
}

export default function SectionErrorState({
  label,
  title,
  description,
  onRetry,
  retrying = false,
  compact = false,
  className = "",
}: SectionErrorStateProps) {
  const heading =
    title ?? (label ? `Couldn't load ${label}` : "Couldn't load this");
  const body =
    description ??
    "We couldn't reach the server just now. This isn't empty — it just hasn't loaded. Try again in a moment.";

  if (compact) {
    return (
      <div
        role="alert"
        className={`font-funnel rounded-nested flex items-center gap-2.5 border border-slate-100 px-3.5 py-3 dark:border-slate-800/60 ${className}`}
      >
        <AlertTriangle
          size={15}
          className="shrink-0 text-amber-500"
        />
        <p className="min-w-0 flex-1 text-[11.5px] text-slate-500 dark:text-slate-400">
          {heading}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#DFF9EF] px-3 py-1 text-[10.5px] font-medium text-[#0A1F4D] transition-colors hover:brightness-95 disabled:opacity-60"
          >
            {retrying ? (
              <Loader2
                size={11}
                className="animate-spin motion-reduce:animate-none"
              />
            ) : (
              <RefreshCw size={11} />
            )}
            {retrying ? "Retrying…" : "Try again"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={`font-funnel flex flex-col items-center justify-center gap-3.5 px-6 py-10 text-center ${className}`}
    >
      <div className="rounded-nested flex h-12 w-12 items-center justify-center bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
        <AlertTriangle size={22} />
      </div>
      <div className="max-w-[360px] space-y-1">
        <p className="font-geist text-[13px] font-medium text-[#0A1F4D] dark:text-white">
          {heading}
        </p>
        <p className="text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
          {body}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="bg-brand-gradient flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-[11px] font-medium text-white transition-all hover:brightness-110 active:scale-98 disabled:pointer-events-none disabled:opacity-50"
        >
          {retrying ? (
            <Loader2
              size={13}
              className="animate-spin motion-reduce:animate-none"
            />
          ) : (
            <RefreshCw size={13} />
          )}
          {retrying ? "Retrying…" : "Try again"}
        </button>
      )}
    </div>
  );
}
