"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Sparkles,
  Home,
  MessageSquare,
  Compass,
  Download,
  Brain,
} from "lucide-react";
import { useAppNavigation, TabState } from "@/hooks/useAppNavigation";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { useUiStore } from "@/store/useUiStore";
import ProfileSettingsPage from "@/modules/account/components/ProfileSettingsPage";
import AssistantModeOverlay from "@/modules/account/components/AssistantModeOverlay";
import ChatHistoryDrawer from "./ChatHistoryDrawer";
import MobileAccountMenu from "./MobileAccountMenu";
import ServerUnreachableBanner from "./ServerUnreachableBanner";
import WebSidebar from "./WebSidebar";

// Chat is placed in the centre and rendered as a standout button.
const NAV_ITEMS: {
  id: TabState;
  label: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    color?: string;
  }>;
}[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "import", label: "Import", icon: Download },
  { id: "memory", label: "Memory", icon: Brain },
];

/**
 * The signed-in app frame. Desktop (≥1024px): a left sidebar (nav + chat
 * history) beside the main panel. Narrower: a single centred mobile column
 * — header, page, bottom nav with the raised Chat button — so a visitor on a
 * phone sees the same layout as the app.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { activeTab, setActiveTab, createNewChat, pathname } =
    useAppNavigation();
  const isDesktopWeb = useIsDesktopWeb();

  const showProfileSettings = useUiStore((s) => s.profileSettingsOpen);
  const setShowProfileSettings = useUiStore((s) => s.setProfileSettingsOpen);
  const showAssistant = useUiStore((s) => s.assistantOpen);
  const setShowAssistant = useUiStore((s) => s.setAssistantOpen);

  // Tapping Chat while already on Chat starts a fresh conversation — the
  // bottom nav's only way to say "start over" without the history drawer.
  const handleTabSelect = (tab: TabState) => {
    if (tab === "chat" && activeTab === "chat") {
      createNewChat();
      return;
    }
    setActiveTab(tab);
  };

  // Pages animate in when the tab changes, not on every sub-route or query.
  const screenKey = activeTab ?? pathname;
  const screen = (
    <motion.div
      key={screenKey}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex h-full w-full flex-1 flex-col overflow-hidden"
    >
      {children}
    </motion.div>
  );

  const overlays = (
    <>
      {/* Mobile layout only — the desktop sidebar lists history inline. */}
      {!isDesktopWeb && <ChatHistoryDrawer />}

      <AnimatePresence>
        {showProfileSettings && (
          <ProfileSettingsPage onClose={() => setShowProfileSettings(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAssistant && (
          <AssistantModeOverlay onClose={() => setShowAssistant(false)} />
        )}
      </AnimatePresence>
    </>
  );

  // Desktop: fixed left sidebar (nav + chat history) + main panel.
  if (isDesktopWeb) {
    return (
      <div className="flex h-full w-full overflow-hidden bg-transparent">
        <WebSidebar />
        <main
          data-popup-root
          className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden"
        >
          <ServerUnreachableBanner />
          {/* Full panel width — each screen centres its own content column
              (and Chat its reading column), so the wave footer can run edge
              to edge. */}
          {screen}
        </main>
        {overlays}
      </div>
    );
  }

  // Mobile-style single column, centred on wider-than-phone windows.
  return (
    <div className="flex h-full w-full justify-center overflow-hidden bg-transparent">
      <div className="relative flex h-full max-w-[560px] flex-1 flex-col overflow-hidden">
        {/* Top Header: logo left · assistant + profile right. Padding-top
            clears the notch/status bar (viewport-fit=cover). */}
        <header
          className="font-funnel z-30 flex h-[56px] shrink-0 items-center justify-between bg-white px-5 select-none"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            height: "calc(56px + env(safe-area-inset-top))",
          }}
        >
          <div
            className="flex cursor-pointer items-center gap-2"
            onClick={() => handleTabSelect("home")}
          >
            <Image
              src="/logo/Finsharpe Logo - Icon.svg"
              alt="Finsharpe"
              width={22}
              height={22}
              className="h-[22px] w-[22px]"
              priority
            />
            <span className="font-geist text-[13px] font-medium tracking-tight text-[#0A1F4D]">
              FinSharpe<span className="text-[#063BAA]">GPT</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAssistant(true)}
              className="hover-tint flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-[#063BAA] transition-colors"
              title="AI Assistant"
            >
              <Sparkles size={15} />
            </button>
            {/* Identity, theme, MCP Access, Delete Account and Sign out live
                under this avatar (T-02); the bottom bar stays a pure 5-tab. */}
            <MobileAccountMenu />
          </div>
        </header>

        <ServerUnreachableBanner />

        {/* Main Page Area */}
        <main className="relative flex w-full flex-1 flex-col overflow-hidden">
          {screen}
        </main>

        {/* Bottom Navigation — full-width fixed bar, Chat centred & raised */}
        <div className="absolute right-0 bottom-0 left-0 z-40 select-none">
          <div
            className="flex items-end justify-around border-t border-slate-100 bg-white px-2 pt-2 shadow-[0_-6px_24px_-10px_rgba(10,31,77,0.14)]"
            style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              if (item.id === "chat") {
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id)}
                    whileTap={{ scale: 0.92 }}
                    // pb matches the other items' label height, so the FAB keeps its raised position.
                    className="flex flex-1 flex-col items-center pb-[18px] outline-none"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    aria-label={item.label}
                  >
                    <div className="bg-brand-gradient -mt-7 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg ring-4 shadow-blue-900/30 ring-[var(--card-bg)]">
                      <Icon
                        size={24}
                        strokeWidth={2}
                        color="#ffffff"
                      />
                    </div>
                  </motion.button>
                );
              }

              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-1 flex-col items-center gap-0.5 py-1.5 outline-none"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <Icon
                    size={21}
                    strokeWidth={2}
                    color={isActive ? "#063BAA" : "#455578"}
                  />
                  <span
                    className={`font-funnel text-[10px] font-medium ${isActive ? "text-[#063BAA]" : "text-slate-400"}`}
                  >
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {overlays}
      </div>
    </div>
  );
}
