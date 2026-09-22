"use client";

import { ChevronRight, User } from "lucide-react";
import { accountProfile } from "../../constants/placeholderContent";
import { InfoRow, MintBadge, SignOutButton } from "../shared/AccountKit";

interface Props {
  name: string;
  email: string | null;
  initials: string | null;
  onOpenProfileSettings: () => void;
  onSignOut: () => void;
  signingOut: boolean;
}

export function ProfileTab({
  name,
  email,
  initials,
  onOpenProfileSettings,
  onSignOut,
  signingOut,
}: Props) {
  return (
    <>
      <div className="glass-card rounded-card flex flex-col items-center gap-2.5 p-6 text-center">
        <div className="bg-brand-gradient font-geist flex h-16 w-16 items-center justify-center rounded-full text-lg font-medium text-white">
          {initials ?? <User size={24} />}
        </div>
        <div className="w-full min-w-0">
          {name && (
            <h3 className="font-geist truncate text-sm font-medium text-[#0A1F4D]">
              {name}
            </h3>
          )}
          {email && (
            <p className="truncate text-[11px] text-slate-400">{email}</p>
          )}
        </div>
        <MintBadge>{accountProfile.badge}</MintBadge>
        <button
          onClick={onOpenProfileSettings}
          className="bg-brand-gradient mt-2 flex w-full items-center justify-center gap-1.5 rounded-full px-6 py-2.5 text-[11px] font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-98"
        >
          View Profile Settings <ChevronRight size={13} />
        </button>
      </div>

      <div className="glass-card rounded-card p-5">
        <InfoRow
          label="Email"
          value={email ?? "—"}
        />
        <InfoRow
          label="Phone"
          value={accountProfile.phone}
        />
        <InfoRow
          label="Member Since"
          value={accountProfile.memberSince}
        />
      </div>

      <SignOutButton
        onClick={onSignOut}
        disabled={signingOut}
      />
    </>
  );
}
