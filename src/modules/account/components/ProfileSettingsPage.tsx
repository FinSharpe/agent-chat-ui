"use client";

import { motion } from "framer-motion";
import { ArrowLeft, User } from "lucide-react";
import OverlayColumn from "@/components/shared/OverlayColumn";
import { useAccountUser } from "../hooks/useAccountUser";
import { InfoRow, MintBadge, SignOutButton } from "./shared/AccountKit";
import {
  AccountDestinationsSection,
  DeleteAccountSection,
} from "./shared/AccountActionRows";

/**
 * The only account screen left (T-02): who is signed in, Credits and MCP
 * Access, sign out and — last, drawn destructive but quiet — Delete account.
 *
 * Everything the old Account Settings modal showed beside this — usage,
 * billing, security, token and subscription figures — was invented, so it was
 * deleted rather than kept as decoration. This page shows exactly what the
 * backend actually knows about the signed-in user, and nothing else; add a
 * section here when an API exists to fill it.
 */
export default function ProfileSettingsPage({
  onClose,
}: {
  onClose: () => void;
}) {
  const { name, email, initials, roles, signOut, signingOut } =
    useAccountUser();

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
      className="font-funnel bg-background pointer-events-auto absolute inset-0 z-[65] flex flex-col overflow-hidden select-none"
    >
      <OverlayColumn>
        <div className="flex h-[56px] shrink-0 items-center gap-3 border-b border-slate-50 px-5 dark:border-slate-800/40">
          <button
            onClick={onClose}
            aria-label="Back"
            className="hover-tint flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-[#0A1F4D] transition-colors dark:border-slate-800 dark:text-white"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="font-geist text-sm font-medium text-[#0A1F4D] dark:text-white">
            Profile
          </span>
        </div>

        <div className="scrollbar-none flex-1 space-y-5 overflow-y-auto p-5">
          <div className="glass-card rounded-card flex items-center gap-4 p-5">
            <div className="bg-brand-gradient font-geist flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-medium text-white">
              {initials ?? <User size={22} />}
            </div>
            <div className="min-w-0">
              {name && (
                <h3 className="font-geist truncate text-sm font-medium text-[#0A1F4D] dark:text-white">
                  {name}
                </h3>
              )}
              {email && (
                <p className="truncate text-[11px] text-slate-400">{email}</p>
              )}
              {roles.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {roles.map((role) => (
                    <MintBadge
                      key={role}
                      className="px-2 py-0.5"
                    >
                      {role}
                    </MintBadge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card rounded-card px-5 py-1">
            <InfoRow
              label="Name"
              value={name || "—"}
            />
            {/* Email only exists once /auth/me has answered — the first-paint
                cookie carries no PII. */}
            <InfoRow
              label="Email"
              value={email ?? "—"}
            />
          </div>

          <AccountDestinationsSection onLeave={onClose} />

          <SignOutButton
            onClick={signOut}
            disabled={signingOut}
          />

          <DeleteAccountSection onLeave={onClose} />
        </div>
      </OverlayColumn>
    </motion.div>
  );
}
