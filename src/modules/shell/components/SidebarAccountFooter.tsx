"use client";

import React from "react";
import { LogIn, LogOut, Moon, Sun, User } from "lucide-react";
import { useAccountActions } from "../hooks/useAccountActions";

/**
 * The desktop sidebar's bottom block (T-02). There is no Account Settings
 * screen: the theme switch sits on its own row, and the identity row carries
 * the name (opens Profile) plus a logout button of its own. MCP Access and
 * Delete account live on the Profile page.
 *
 * Signed out, the identity row becomes a Login button.
 */

const ROW =
  "rounded-tile hover-tint flex w-full items-center gap-2.5 px-2.5 text-left transition-colors";

/** Track-and-knob switch; the row itself is the click target. */
function ThemeSwitch({ dark }: { dark: boolean }) {
  return (
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
  );
}

function Avatar({
  initials,
  size = "h-9 w-9",
}: {
  initials: string | null;
  size?: string;
}) {
  return (
    <span
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-[#063BAA]/8 text-[#063BAA]`}
    >
      {initials ? (
        <span className="text-[11.5px] font-medium">{initials}</span>
      ) : (
        <User size={16} />
      )}
    </span>
  );
}

export default function SidebarAccountFooter({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const {
    name,
    signedIn,
    isResolving,
    initials,
    themeMode,
    toggleThemeMode,
    openProfile,
    openLogin,
    logout,
  } = useAccountActions();
  const dark = themeMode === "dark";
  const ThemeIcon = dark ? Moon : Sun;

  if (collapsed) {
    return (
      <div className="w-full shrink-0 space-y-1 px-2 pb-2">
        <button
          onClick={toggleThemeMode}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          className="rounded-tile hover-tint flex h-10 w-full items-center justify-center text-slate-400 transition-colors hover:text-[#063BAA]"
        >
          <ThemeIcon size={19} />
        </button>
        {signedIn ? (
          <>
            <button
              onClick={openProfile}
              title={name || "Profile"}
              className="rounded-tile hover-tint flex h-12 w-full items-center justify-center transition-colors"
            >
              <Avatar initials={initials} />
            </button>
            <button
              onClick={logout}
              title="Sign out"
              className="rounded-tile hover-tint flex h-10 w-full items-center justify-center text-slate-400 transition-colors hover:text-rose-600 dark:hover:text-rose-400"
            >
              <LogOut size={18} />
            </button>
          </>
        ) : isResolving ? (
          <div className="flex h-12 w-full items-center justify-center">
            <span className="h-9 w-9 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
        ) : (
          <button
            onClick={openLogin}
            title="Login"
            className="rounded-tile bg-brand-gradient flex h-10 w-full items-center justify-center text-white transition-all hover:brightness-110"
          >
            <LogIn size={18} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="shrink-0 space-y-0.5 p-2">
      <button
        onClick={toggleThemeMode}
        aria-pressed={dark}
        className={`${ROW} h-10 text-[#0A1F4D] dark:text-slate-300`}
      >
        <ThemeIcon
          size={20}
          strokeWidth={2}
        />
        <span className="flex-1 text-[13.5px] font-medium">
          {dark ? "Dark mode" : "Light mode"}
        </span>
        <ThemeSwitch dark={dark} />
      </button>

      {signedIn ? (
        <div className={`${ROW} h-12`}>
          <button
            onClick={openProfile}
            title="Profile"
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          >
            <Avatar initials={initials} />
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-[#0A1F4D] dark:text-white">
              {name || "Account"}
            </span>
          </button>
          {/* Its own button, never part of the row's target: one click signs
              out, as in the reference. */}
          <button
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
            className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          >
            <LogOut size={16} />
          </button>
        </div>
      ) : isResolving ? (
        <div className={`${ROW} h-12`}>
          <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
          <span className="h-3 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : (
        <button
          onClick={openLogin}
          className="rounded-tile bg-brand-gradient flex h-10 w-full items-center justify-center gap-2 text-[13.5px] font-medium text-white transition-all hover:brightness-110 active:scale-98"
        >
          <LogIn size={16} />
          Login
        </button>
      )}
    </div>
  );
}
