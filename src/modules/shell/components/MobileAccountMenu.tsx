"use client";

import React, { useState } from "react";
import {
  LogIn,
  LogOut,
  Moon,
  Plug,
  Sun,
  Trash2,
  User,
  UserCog,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAccountActions } from "../hooks/useAccountActions";

/**
 * The mobile header avatar's menu (T-02, the user's decision: here rather
 * than in the chat-history drawer; the 5-tab bottom bar is left alone).
 *
 * It goes through the app's Popover wrapper, so it portals into the unzoomed
 * floating root and inherits the shell's theme (see portal-container.tsx).
 * Signed out, the avatar is replaced by a Login button.
 */

const ITEM =
  "rounded-tile hover-tint flex h-9 w-full items-center gap-2.5 px-2.5 text-left text-[12.5px] font-medium transition-colors";

const AVATAR_BUTTON =
  "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#063BAA]/10 bg-[#DFF9EF] text-[10px] font-medium text-[#0A1F4D] transition-colors";

export default function MobileAccountMenu() {
  const {
    name,
    signedIn,
    isResolving,
    initials,
    themeMode,
    toggleThemeMode,
    openProfile,
    openMcpAccess,
    openDeleteAccount,
    openLogin,
    logout,
  } = useAccountActions();
  const [open, setOpen] = useState(false);
  const dark = themeMode === "dark";
  const ThemeIcon = dark ? Moon : Sun;

  // Session still unknown — a placeholder, never a Login button (see
  // useAccountActions' isResolving).
  if (isResolving) {
    return (
      <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
    );
  }

  if (!signedIn) {
    return (
      <button
        onClick={openLogin}
        className="bg-brand-gradient flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium text-white transition-all hover:brightness-110 active:scale-98"
      >
        <LogIn size={13} />
        Login
      </button>
    );
  }

  // Every row but the theme switch navigates or signs out, so it closes the
  // menu first — the menu sits above the page it is sending you to.
  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <button
          className={AVATAR_BUTTON}
          title={name || "Account"}
          aria-label="Account menu"
        >
          {initials ? <span>{initials}</span> : <User size={15} />}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="font-funnel w-[214px] rounded-[18px] border-slate-100 p-1.5 shadow-[0_18px_40px_-20px_rgba(10,31,77,0.35)] dark:border-slate-800"
      >
        {name && (
          <p className="truncate px-2.5 pt-1 pb-2 text-[11px] text-slate-400">
            {name}
          </p>
        )}

        <button
          onClick={toggleThemeMode}
          aria-pressed={dark}
          className={`${ITEM} text-[#0A1F4D] dark:text-slate-200`}
        >
          <ThemeIcon
            size={16}
            className="shrink-0 text-slate-400"
          />
          <span className="flex-1">{dark ? "Dark mode" : "Light mode"}</span>
          <span
            aria-hidden
            className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${
              dark ? "bg-[#063BAA]" : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
                dark ? "translate-x-3" : "translate-x-0"
              }`}
            />
          </span>
        </button>

        <button
          onClick={run(openProfile)}
          className={`${ITEM} text-[#0A1F4D] dark:text-slate-200`}
        >
          <UserCog
            size={16}
            className="shrink-0 text-slate-400"
          />
          Profile
        </button>

        <button
          onClick={run(openMcpAccess)}
          className={`${ITEM} text-[#0A1F4D] dark:text-slate-200`}
        >
          <Plug
            size={16}
            className="shrink-0 text-slate-400"
          />
          MCP Access
        </button>

        <button
          onClick={run(openDeleteAccount)}
          className={`${ITEM} text-slate-400 hover:text-rose-600 dark:hover:text-rose-400`}
        >
          <Trash2
            size={16}
            className="shrink-0"
          />
          Delete Account
        </button>

        <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />

        {/* One tap signs out — no confirm, matching the reference. */}
        <button
          onClick={run(logout)}
          className={`${ITEM} text-rose-600 dark:text-rose-400`}
        >
          <LogOut
            size={16}
            className="shrink-0"
          />
          Sign out
        </button>
      </PopoverContent>
    </Popover>
  );
}
