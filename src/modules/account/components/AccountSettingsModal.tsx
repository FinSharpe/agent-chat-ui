"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import OverlayColumn from "@/components/shared/OverlayColumn";
import { useAccountUser } from "../hooks/useAccountUser";
import type { AccountTab } from "../types";
import { PillTabs } from "./shared/AccountKit";
import { ProfileTab } from "./account-tabs/ProfileTab";
import { UsageTab } from "./account-tabs/UsageTab";
import { SecurityTab } from "./account-tabs/SecurityTab";
import { BillingTab } from "./account-tabs/BillingTab";
import { SettingsTab } from "./account-tabs/SettingsTab";

interface Props {
  onClose: () => void;
  onOpenProfileSettings: () => void;
}

const TABS: { id: AccountTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "usage", label: "Usage" },
  { id: "security", label: "Security" },
  { id: "billing", label: "Billing" },
  { id: "settings", label: "Settings" },
];

/**
 * Full-screen account overlay hosted by the app shell (sidebar footer on
 * desktop, header avatar on mobile). On desktop its content sits in the same
 * centred column as the pages beneath.
 */
export default function AccountSettingsModal({
  onClose,
  onOpenProfileSettings,
}: Props) {
  const router = useRouter();
  const { name, email, initials, signOut, signingOut } = useAccountUser();
  const [tab, setTab] = useState<AccountTab>("profile");

  // The overlay lives in the shell above every route, so it must close
  // before a page it links to can be seen.
  const navigate = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="font-funnel pointer-events-auto absolute inset-0 z-[60] flex flex-col overflow-hidden bg-white select-none"
    >
      <OverlayColumn>
        {/* Header */}
        <div className="flex h-[56px] shrink-0 items-center justify-between border-b border-slate-50 px-5">
          <span className="font-geist text-sm font-medium text-[#0A1F4D]">
            Account Settings
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="hover-tint flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-[#0A1F4D] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <PillTabs
          tabs={TABS}
          active={tab}
          onChange={setTab}
        />

        {/* Content */}
        <div className="scrollbar-none flex-1 space-y-5 overflow-y-auto p-5">
          {tab === "profile" && (
            <ProfileTab
              name={name}
              email={email}
              initials={initials}
              onOpenProfileSettings={onOpenProfileSettings}
              onSignOut={signOut}
              signingOut={signingOut}
            />
          )}
          {tab === "usage" && <UsageTab />}
          {tab === "security" && (
            <SecurityTab
              onSignOut={signOut}
              signingOut={signingOut}
            />
          )}
          {tab === "billing" && <BillingTab />}
          {tab === "settings" && (
            <SettingsTab
              onOpenMcp={() => navigate("/settings/mcp")}
              onDeleteAccount={() => navigate("/delete-account")}
              onSignOut={signOut}
              signingOut={signingOut}
            />
          )}
        </div>
      </OverlayColumn>
    </motion.div>
  );
}
