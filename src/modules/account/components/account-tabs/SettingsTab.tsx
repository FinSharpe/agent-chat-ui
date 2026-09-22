"use client";

import {
  Bell,
  Download,
  Moon,
  Palette,
  Plug,
  ShieldCheck,
  Sun,
  Trash2,
} from "lucide-react";
import { useUiStore, type ThemeMode } from "@/store/useUiStore";
import { accountAppSettings } from "../../constants/placeholderContent";
import type { ToneClass } from "../../types";
import { ActionRow, SignOutButton } from "../shared/AccountKit";

const APP_SETTING_ICONS = [Bell, Download, ShieldCheck];
const TONES: ToneClass[] = ["tone-mint", "tone-navy", "tone-blue"];

interface Props {
  onOpenMcp: () => void;
  onDeleteAccount: () => void;
  onSignOut: () => void;
  signingOut: boolean;
}

function ThemeOption({
  mode,
  current,
  onSelect,
}: {
  mode: ThemeMode;
  current: ThemeMode;
  onSelect: (mode: ThemeMode) => void;
}) {
  const Icon = mode === "light" ? Sun : Moon;
  return (
    <button
      onClick={() => onSelect(mode)}
      aria-pressed={current === mode}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[11px] font-medium capitalize transition-colors ${
        current === mode ? "bg-[#063BAA] text-white" : "text-slate-500"
      }`}
    >
      <Icon size={13} /> {mode}
    </button>
  );
}

export function SettingsTab({
  onOpenMcp,
  onDeleteAccount,
  onSignOut,
  signingOut,
}: Props) {
  // Persisted by the UI store, so the choice survives a reload.
  const themeMode = useUiStore((s) => s.themeMode);
  const setThemeMode = useUiStore((s) => s.setThemeMode);

  return (
    <>
      <h3 className="font-geist px-1 text-sm font-medium text-[#0A1F4D]">
        App Appearance
      </h3>
      <div className="glass-card rounded-card space-y-3 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-tile flex h-8 w-8 shrink-0 items-center justify-center bg-[#063BAA]/8 text-[#063BAA]">
            <Palette size={15} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-[#0A1F4D]">Theme</p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Choose light or dark mode
            </p>
          </div>
        </div>
        <div className="glass-tile flex items-center gap-1 rounded-full p-1">
          <ThemeOption
            mode="light"
            current={themeMode}
            onSelect={setThemeMode}
          />
          <ThemeOption
            mode="dark"
            current={themeMode}
            onSelect={setThemeMode}
          />
        </div>
      </div>

      <h3 className="font-geist px-1 text-sm font-medium text-[#0A1F4D]">
        App Settings
      </h3>
      <div className="glass-card rounded-card p-5">
        {accountAppSettings.map((row, i) => {
          const Icon = APP_SETTING_ICONS[i % APP_SETTING_ICONS.length];
          return (
            <ActionRow
              key={row.label}
              icon={<Icon size={15} />}
              label={row.label}
              sub={row.sub}
              action={row.action}
              tone={TONES[i % 3]}
            />
          );
        })}
        <ActionRow
          icon={<Plug size={15} />}
          label="MCP Access"
          sub="Connect Claude Desktop & MCP clients"
          action="Open"
          onAction={onOpenMcp}
          tone={TONES[accountAppSettings.length % 3]}
        />
      </div>

      <h3 className="font-geist px-1 text-sm font-medium text-[#0A1F4D]">
        Account
      </h3>
      <div className="glass-card rounded-card p-5">
        <ActionRow
          icon={<Trash2 size={15} />}
          label="Delete Account"
          sub="Permanently remove your account"
          action="Delete"
          onAction={onDeleteAccount}
          danger
        />
      </div>

      <SignOutButton
        onClick={onSignOut}
        disabled={signingOut}
      />
    </>
  );
}
