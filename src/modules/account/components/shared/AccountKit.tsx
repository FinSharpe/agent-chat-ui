"use client";

import React from "react";
import { Check, LogOut } from "lucide-react";
import type { ToneClass } from "../../types";

/* Building blocks shared by the Account Settings modal and the Profile
   Settings page, ported from the reference so both read as one family. */

/** Pill tab strip under an overlay header. */
export function PillTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (tab: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="scrollbar-none flex shrink-0 gap-1.5 overflow-x-auto border-b border-slate-50 px-4 py-3"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-full px-3.5 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors ${
            active === t.id
              ? "bg-[#063BAA] text-white"
              : "bg-[#063BAA]/6 text-slate-500 hover:text-[#063BAA]"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Small uppercase mint status badge ("Premium", "Active"…). */
export function MintBadge({
  children,
  className = "px-2.5 py-1",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`rounded-full bg-[#97edcc]/25 text-[9px] font-medium tracking-wider text-[#0A9E6E] uppercase ${className}`}
    >
      {children}
    </span>
  );
}

/** Label / value row, closed by a hairline except the last. */
export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-50 py-3 last:border-b-0">
      <span className="text-[11px] font-medium text-slate-400">{label}</span>
      <span className="min-w-0 truncate text-xs font-medium text-[#0A1F4D]">
        {value}
      </span>
    </div>
  );
}

/**
 * Icon tile, label, supporting line and an optional pill action. `danger`
 * swaps the brand tones for rose, for irreversible actions.
 */
export function ActionRow({
  icon,
  label,
  sub,
  action,
  onAction,
  verified,
  tone = "tone-blue",
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  action?: string;
  onAction?: () => void;
  verified?: boolean;
  tone?: ToneClass;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-3.5 border-b border-slate-50 py-3.5 last:border-b-0">
      <div
        className={`rounded-tile flex h-9 w-9 shrink-0 items-center justify-center ${
          danger
            ? "bg-rose-50 text-rose-600 dark:bg-rose-500/12 dark:text-rose-400"
            : tone
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p
          className={`text-xs font-medium ${danger ? "text-rose-600 dark:text-rose-400" : "text-[#0A1F4D]"}`}
        >
          {label}
        </p>
        <p
          className={`text-[10px] ${verified ? "flex items-center gap-1 text-[#0A9E6E]" : "text-slate-400"}`}
        >
          {verified && (
            <Check
              size={11}
              strokeWidth={3}
            />
          )}
          {sub}
        </p>
      </div>
      {action && (
        <button
          onClick={onAction}
          className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-medium transition-colors ${
            danger
              ? "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/12 dark:text-rose-400 dark:hover:bg-rose-500/20"
              : "bg-[#DFF9EF] text-[#0A1F4D]"
          }`}
        >
          {action}
        </button>
      )}
    </div>
  );
}

export function SignOutButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 px-6 py-3 text-xs font-medium tracking-wide text-rose-600 uppercase transition-all hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-500/10"
    >
      <LogOut size={14} /> {disabled ? "Signing Out…" : "Sign Out"}
    </button>
  );
}
