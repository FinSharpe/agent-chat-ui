"use client";

import React from "react";
import { ChevronRight, Plug, Trash2, type LucideIcon } from "lucide-react";
// By file path, not "@/modules/shell": the shell's index re-exports AppShell,
// which imports the Profile overlay — a cycle.
import { useAccountActions } from "@/modules/shell/hooks/useAccountActions";

/**
 * The two account destinations that used to sit in the shell's nav: MCP
 * Access, and Delete account at the page's foot, destructive but quiet. Both
 * leave the Profile overlay, so it is closed first — otherwise its store flag
 * would still be set and reopen it on the way back.
 */
function useLeave(onLeave: () => void) {
  return (action: () => void) => () => {
    onLeave();
    action();
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 px-1 text-[10px] font-semibold tracking-[0.07em] text-slate-400 uppercase">
      {children}
    </p>
  );
}

export function McpAccessSection({ onLeave }: { onLeave: () => void }) {
  const { openMcpAccess } = useAccountActions();
  const leave = useLeave(onLeave);
  return (
    <section>
      <SectionLabel>Connections</SectionLabel>
      <div className="glass-card rounded-card px-2 py-1">
        <ActionRow
          icon={Plug}
          title="MCP Access"
          subtitle="Connect Claude Desktop & other MCP clients"
          onClick={leave(openMcpAccess)}
        />
      </div>
    </section>
  );
}

export function DeleteAccountSection({ onLeave }: { onLeave: () => void }) {
  const { openDeleteAccount } = useAccountActions();
  const leave = useLeave(onLeave);
  return (
    <section className="pt-3">
      <SectionLabel>Danger zone</SectionLabel>
      <div className="glass-card rounded-card px-2 py-1">
        <ActionRow
          icon={Trash2}
          title="Delete account"
          subtitle="What is deleted, what is kept, and how"
          onClick={leave(openDeleteAccount)}
          danger
        />
      </div>
    </section>
  );
}

function ActionRow({
  icon: Icon,
  title,
  subtitle,
  onClick,
  danger = false,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-nested hover-tint group flex w-full items-center gap-3 px-3 py-3 text-left transition-colors"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          danger
            ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
            : "bg-[var(--tone-blue)] text-[var(--tone-blue-fg)]"
        }`}
      >
        <Icon size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[13px] font-medium ${
            danger
              ? "text-rose-600 dark:text-rose-400"
              : "text-[#0A1F4D] dark:text-white"
          }`}
        >
          {title}
        </span>
        <span className="block truncate text-[11px] text-slate-400">
          {subtitle}
        </span>
      </span>
      <ChevronRight
        size={16}
        className="shrink-0 text-slate-400"
      />
    </button>
  );
}
