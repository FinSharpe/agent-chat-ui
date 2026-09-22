"use client";

import React from "react";
import { LogOut } from "lucide-react";

/* The pieces the Profile overlay is built from, ported from the reference.
   The rest of this kit (pill tabs, action rows, tone tiles) went with the
   Account Settings screen it was written for — see T-02. */

/** Small uppercase mint badge ("user", "admin"…). */
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
    <div className="flex items-center justify-between gap-4 border-b border-slate-50 py-3 last:border-b-0 dark:border-slate-800/40">
      <span className="text-[11px] font-medium text-slate-400">{label}</span>
      <span className="min-w-0 truncate text-xs font-medium text-[#0A1F4D] dark:text-white">
        {value}
      </span>
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
      className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 px-6 py-3 text-xs font-medium tracking-wide text-rose-600 uppercase transition-all hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
    >
      <LogOut size={14} /> {disabled ? "Signing Out…" : "Sign Out"}
    </button>
  );
}
