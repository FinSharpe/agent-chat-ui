"use client";

import React, { useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import {
  ChevronRight,
  LogIn,
  Moon,
  Plug,
  Sun,
  User,
  type LucideIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAccountActions } from "../hooks/useAccountActions";

/**
 * The mobile header avatar's account sheet — finsharpe-mobile's
 * `account_sheet.dart`, drawn on the web: drag handle, the identity row
 * (opens Profile, the web's "Your account"), Appearance, Sign out, and
 * Delete account kept faint at the foot, where the owner wanted it on the
 * app (findable by someone looking, invisible to someone who is not).
 *
 * MCP Access is web-only, so it is the one row the app's sheet does not have.
 * The app's System theme segment is left out: the web theme is light or dark.
 * Signed out, the avatar is replaced by a Login button.
 */

const AVATAR_BUTTON =
  "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#063BAA]/10 bg-[#DFF9EF] text-[10px] font-medium text-[#0A1F4D] transition-colors";

// A drag past this, or a flick, dismisses — Material's sheet behaviour.
const DISMISS_OFFSET = 80;
const DISMISS_VELOCITY = 500;

export default function MobileAccountMenu() {
  const {
    name,
    email,
    signedIn,
    isResolving,
    initials,
    themeMode,
    setThemeMode,
    openProfile,
    openMcpAccess,
    openDeleteAccount,
    openLogin,
    logout,
  } = useAccountActions();
  const [open, setOpen] = useState(false);

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

  // Every action but the theme switch leaves the sheet, so it closes first.
  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={AVATAR_BUTTON}
        title={name || "Account"}
        aria-label="Account"
        aria-haspopup="dialog"
      >
        {initials ? <span>{initials}</span> : <User size={15} />}
      </button>

      <Sheet
        open={open}
        onOpenChange={setOpen}
      >
        <SheetContent
          side="bottom"
          showClose={false}
          overlayClassName="bg-[#0A1F4D]/30 backdrop-blur-none dark:bg-black/60"
          className="font-funnel mx-auto max-w-[560px] gap-0 rounded-t-[30px] border-0 bg-[var(--card-bg)] shadow-none"
        >
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
            className="touch-pan-y"
          >
            <div className="flex justify-center pt-[18px] pb-2">
              <span className="h-1 w-9 rounded-full bg-[var(--card-border)]" />
            </div>

            <div
              className="px-5 pt-2"
              style={{
                paddingBottom: "max(20px, env(safe-area-inset-bottom))",
              }}
            >
              <SheetTitle className="sr-only">Account</SheetTitle>
              <SheetDescription className="sr-only">
                Your profile, appearance and sign out
              </SheetDescription>

              <SheetRow
                icon={User}
                title={name || "Signed in"}
                subtitle={email}
                onClick={run(openProfile)}
              />

              <p className="mt-3.5 text-[10px] font-semibold tracking-[0.07em] text-slate-400 uppercase">
                Appearance
              </p>
              <ThemeToggle
                value={themeMode}
                onChange={setThemeMode}
              />

              <div className="mt-4">
                <SheetRow
                  icon={Plug}
                  title="MCP Access"
                  onClick={run(openMcpAccess)}
                />
              </div>

              {/* One tap signs out, no confirm — the app's sheet does the
                  same; a drag or the scrim is the way out without it. */}
              <button
                onClick={run(logout)}
                className="mt-4 flex h-[52px] w-full items-center justify-center rounded-full border border-[#063BAA]/30 text-[14px] font-medium text-[#063BAA] transition-colors hover:bg-[var(--tone-blue-weak)] dark:border-white/20 dark:text-[var(--tone-blue-fg)]"
              >
                Sign out
              </button>

              <div className="mt-2 flex justify-center">
                <button
                  onClick={run(openDeleteAccount)}
                  className="px-2 py-2.5 text-[11px] text-slate-400 transition-colors hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Delete account
                </button>
              </div>
            </div>
          </motion.div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function SheetRow({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-nested hover-tint flex w-full items-center gap-3 py-1.5 text-left"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--tone-blue)] text-[var(--tone-blue-fg)]">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-[#0A1F4D] dark:text-slate-100">
          {title}
        </span>
        {subtitle && (
          <span className="block truncate text-[12px] text-slate-400">
            {subtitle}
          </span>
        )}
      </span>
      <ChevronRight
        size={18}
        className="shrink-0 text-slate-400"
      />
    </button>
  );
}

const THEME_SEGMENTS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

function ThemeToggle({
  value,
  onChange,
}: {
  value: "light" | "dark";
  onChange: (mode: "light" | "dark") => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="mt-2 flex gap-1 rounded-full border border-[var(--card-border)] bg-[var(--tone-blue-weak)] p-1"
    >
      {THEME_SEGMENTS.map(({ value: mode, label, icon: Icon }) => {
        const selected = value === mode;
        return (
          <button
            key={mode}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(mode)}
            // Solid brand blue + white in both themes, as on the app.
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[12px] font-medium transition-colors ${
              selected ? "bg-[#063BAA] text-white" : "text-slate-500"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
