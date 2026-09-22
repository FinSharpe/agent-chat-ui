"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import OverlayColumn from "@/components/shared/OverlayColumn";
import { useAccountUser } from "../hooks/useAccountUser";
import type { ProfileTab } from "../types";
import { PillTabs } from "./shared/AccountKit";
import { OverviewTab } from "./profile-tabs/OverviewTab";
import { SubscriptionTab } from "./profile-tabs/SubscriptionTab";
import { UsageAnalyticsTab } from "./profile-tabs/UsageAnalyticsTab";
import { TokenUsageTab } from "./profile-tabs/TokenUsageTab";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "subscription", label: "Subscription" },
  { id: "usage", label: "Usage Analytics" },
  { id: "tokens", label: "Token Usage" },
];

/**
 * Pushed over Account Settings ("View Profile Settings"): slides in from the
 * right, and back slides it away to reveal the modal still open beneath.
 */
export default function ProfileSettingsPage({
  onClose,
}: {
  onClose: () => void;
}) {
  const { name, email, initials } = useAccountUser();
  const [tab, setTab] = useState<ProfileTab>("overview");

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
      className="font-funnel pointer-events-auto absolute inset-0 z-[65] flex flex-col overflow-hidden bg-white select-none"
    >
      <OverlayColumn>
        {/* Header */}
        <div className="flex h-[56px] shrink-0 items-center gap-3 border-b border-slate-50 px-5">
          <button
            onClick={onClose}
            aria-label="Back"
            className="hover-tint flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-[#0A1F4D] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="font-geist text-sm font-medium text-[#0A1F4D]">
            Profile Settings
          </span>
        </div>

        <PillTabs
          tabs={TABS}
          active={tab}
          onChange={setTab}
        />

        <div className="scrollbar-none flex-1 space-y-5 overflow-y-auto p-5">
          {tab === "overview" && (
            <OverviewTab
              name={name}
              email={email}
              initials={initials}
            />
          )}
          {tab === "subscription" && <SubscriptionTab />}
          {tab === "usage" && <UsageAnalyticsTab />}
          {tab === "tokens" && <TokenUsageTab />}
        </div>
      </OverlayColumn>
    </motion.div>
  );
}
