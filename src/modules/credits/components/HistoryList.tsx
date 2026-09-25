import { Loader2, Receipt } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  HISTORY_EMPTY_BODY,
  HISTORY_EMPTY_TITLE,
  SHOW_OLDER,
} from "../constants/copy";
import type { HistoryRowView, HistoryTarget } from "../utils/history";

/**
 * The History as one glass list card of hairline rows, flat — no day groups
 * (#231 decision 2 rejected them). Each row: the title, the line under it
 * ("Today · 14:02 · stopped") and the signed amount. Charges in ink,
 * Allotments and Refunds in the positive green. No "after" figure: the wire
 * carries no running Balance (J8).
 */
export function HistoryList({
  rows,
  onOpen,
}: {
  rows: HistoryRowView[];
  onOpen: (target: NonNullable<HistoryTarget>) => void;
}) {
  return (
    <ul className="glass-card rounded-card px-5 py-1">
      {rows.map((row) => (
        <li
          key={row.key}
          className="border-b border-slate-50 last:border-b-0 dark:border-slate-800/40"
        >
          <HistoryRow
            row={row}
            onOpen={onOpen}
          />
        </li>
      ))}
    </ul>
  );
}

function HistoryRow({
  row,
  onOpen,
}: {
  row: HistoryRowView;
  onOpen: (target: NonNullable<HistoryTarget>) => void;
}) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-[#0A1F4D] dark:text-white">
          {row.title}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-slate-400">
          {row.sub}
        </span>
      </span>
      <span
        data-tone={row.tone}
        className={cn(
          "shrink-0 text-right text-[13px] font-semibold tabular-nums",
          row.tone === "positive"
            ? "text-[#0A9E6E]"
            : "text-[#0A1F4D] dark:text-white",
        )}
      >
        {row.amount}
      </span>
    </>
  );

  const target = row.target;
  if (!target) {
    return <div className="flex items-center gap-4 py-3">{body}</div>;
  }
  return (
    <button
      type="button"
      onClick={() => onOpen(target)}
      className="hover-tint rounded-nested -mx-2 flex w-[calc(100%+1rem)] items-center gap-4 px-2 py-3 text-left transition-colors"
    >
      {body}
    </button>
  );
}

/** Loaded, and nothing there — never shown for a History that failed. */
export function HistoryEmpty() {
  return (
    <div className="glass-card rounded-card flex flex-col items-center gap-2 px-6 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--tone-blue)] text-[var(--tone-blue-fg)]">
        <Receipt size={18} />
      </span>
      <p className="text-[12.5px] font-medium text-[#0A1F4D] dark:text-white">
        {HISTORY_EMPTY_TITLE}
      </p>
      <p className="max-w-[320px] text-[11px] leading-relaxed text-slate-400">
        {HISTORY_EMPTY_BODY}
      </p>
    </div>
  );
}

export function ShowOlderButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="mx-auto flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-medium text-[#063BAA] transition-colors hover:bg-[#063BAA]/8 disabled:opacity-60"
    >
      {loading && (
        <Loader2
          size={13}
          className="animate-spin motion-reduce:animate-none"
        />
      )}
      {SHOW_OLDER}
    </button>
  );
}

export function HistorySkeleton() {
  return (
    <div
      aria-hidden
      className="glass-card rounded-card space-y-3 px-5 py-4"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4"
        >
          <span className="rounded-nested h-8 flex-1 animate-pulse bg-slate-100 dark:bg-slate-800" />
          <span className="h-4 w-14 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}
