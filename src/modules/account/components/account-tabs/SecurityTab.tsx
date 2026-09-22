"use client";

import { Lock, ShieldCheck } from "lucide-react";
import { accountSecurity } from "../../constants/placeholderContent";
import type { ToneClass } from "../../types";
import { ActionRow, SignOutButton } from "../shared/AccountKit";

const TONES: ToneClass[] = ["tone-blue", "tone-mint", "tone-navy"];

export function SecurityTab({
  onSignOut,
  signingOut,
}: {
  onSignOut: () => void;
  signingOut: boolean;
}) {
  return (
    <>
      <h3 className="font-geist px-1 text-sm font-medium text-[#0A1F4D]">
        Security Settings
      </h3>
      <div className="glass-card rounded-card p-5">
        {accountSecurity.map((row, idx) => (
          <ActionRow
            key={row.label}
            icon={row.verified ? <ShieldCheck size={15} /> : <Lock size={15} />}
            label={row.label}
            sub={row.sub}
            action={row.action}
            verified={row.verified}
            tone={TONES[idx % 3]}
          />
        ))}
      </div>
      <SignOutButton
        onClick={onSignOut}
        disabled={signingOut}
      />
    </>
  );
}
